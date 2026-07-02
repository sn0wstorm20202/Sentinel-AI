'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCases } from '@/lib/api/hooks/use-cases';
import { CaseSummary } from '@/types';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  Row,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useInvestigationStore } from '@/store/investigation-store';
import { cn } from '@/lib/utils';


export function CasesTable() {
  const router = useRouter();
  const params = useParams();
  const selectedId = params?.id as string | undefined;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const { data: casesData = [], isLoading } = useCases();
  const parentRef = useRef<HTMLDivElement>(null);
  const focusedCaseId = useInvestigationStore((state) => state.focusedCaseId);
  const setFocusedCaseId = useInvestigationStore((state) => state.setFocusedCaseId);
  const setQueueCaseIds = useInvestigationStore((state) => state.setQueueCaseIds);
  const addRecentCase = useInvestigationStore((state) => state.addRecentCase);
  
  useEffect(() => {
    setQueueCaseIds(casesData.map((caseItem) => caseItem.id));
  }, [casesData, setQueueCaseIds]);

  useEffect(() => {
    if (selectedId) {
      setFocusedCaseId(selectedId);
    }
  }, [selectedId, setFocusedCaseId]);

  const columns = useMemo(() => [
    { 
      accessorKey: 'id', 
      header: 'ID',
      cell: ({ row }: { row: Row<CaseSummary> }) => <span className="font-mono text-xs">{row.getValue('id')}</span>
    },
    {
      accessorKey: 'txId',
      header: 'TX',
      cell: ({ row }: { row: Row<CaseSummary> }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{row.getValue('txId')}</span>
      )
    },
    { 
      accessorKey: 'score', 
      header: 'Score',
      cell: ({ row }: { row: Row<CaseSummary> }) => {
        const s = row.getValue('score') as number;
        return (
          <span className={`font-mono text-xs font-semibold tabular-nums ${s > 90 ? 'text-destructive' : s > 80 ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {s.toFixed(1)}
          </span>
        );
      }
    },
    {
      accessorKey: 'risk',
      header: 'Risk',
      cell: ({ row }: { row: Row<CaseSummary> }) => {
        const risk = row.getValue('risk') as string;
        return (
          <Badge
            variant={risk === 'Critical' ? 'destructive' : risk === 'High' ? 'secondary' : 'outline'}
            size="sm"
            className="uppercase"
          >
            {risk}
          </Badge>
        );
      }
    },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }: { row: Row<CaseSummary> }) => (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.getValue('status')}</span>
      )
    }
  ], []);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: casesData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter }
  });

  const rows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 12,
  });

  useEffect(() => {
    const index = rows.findIndex((row) => row.getValue('id') === focusedCaseId);
    if (index >= 0) {
      rowVirtualizer.scrollToIndex(index, { align: 'auto' });
    }
  }, [focusedCaseId, rowVirtualizer, rows]);

  const openCase = (caseId: string) => {
    setFocusedCaseId(caseId);
    addRecentCase(caseId);
    router.push(`/cases/${caseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-2 p-2">
        <Skeleton className="h-7 w-full" />
        {Array.from({ length: 14 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_60px_72px_60px] gap-2 rounded-md border px-2 py-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-2 border-b shrink-0 bg-background">
        <Input 
          placeholder="Filter cases..." 
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="h-7 bg-muted/50 text-xs focus-visible:ring-1" 
          data-sentinel-search="cases"
          aria-label="Filter investigation queue"
        />
      </div>
      <div ref={parentRef} className="flex-1 overflow-auto bg-card">
        <Table className="w-full text-xs">
          <TableHeader className="bg-muted/30 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-7 py-1 px-2 font-medium text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              <>
                {rowVirtualizer.getVirtualItems()[0]?.start ? (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={columns.length} style={{ height: rowVirtualizer.getVirtualItems()[0].start }} className="p-0" />
                  </TableRow>
                ) : null}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                const isSelected = selectedId === row.getValue('id');
                const isFocused = focusedCaseId === row.getValue('id');
                const caseId = row.getValue('id') as string;
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? "selected" : undefined}
                    aria-selected={isSelected || isFocused}
                    tabIndex={0}
                    className={cn(
                      'cursor-pointer border-b border-border/50 transition-none outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected
                        ? 'bg-primary/10 hover:bg-primary/15'
                        : isFocused
                          ? 'bg-muted/70 hover:bg-muted'
                          : 'hover:bg-muted/50'
                    )}
                    onFocus={() => setFocusedCaseId(caseId)}
                    onClick={() => openCase(caseId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        openCase(caseId);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-1.5 px-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
                {(() => {
                  const virtualItems = rowVirtualizer.getVirtualItems();
                  const lastItem = virtualItems[virtualItems.length - 1];
                  const bottomPadding = lastItem
                    ? rowVirtualizer.getTotalSize() - lastItem.end
                    : 0;
                  return bottomPadding > 0 ? (
                    <TableRow aria-hidden="true">
                      <TableCell colSpan={columns.length} style={{ height: bottomPadding }} className="p-0" />
                    </TableRow>
                  ) : null;
                })()}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No cases found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
