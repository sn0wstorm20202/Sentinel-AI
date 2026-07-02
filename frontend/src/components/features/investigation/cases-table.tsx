'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  Row,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface MockCase {
  id: string;
  txId: string;
  date: string;
  risk: string;
  score: number;
  status: string;
}

const mockCases: MockCase[] = [
  { id: 'CASE_48193', txId: 'TXN_884910', date: '2026-06-30T10:45:02Z', risk: 'Critical', score: 98.2, status: 'Open' },
  { id: 'CASE_48194', txId: 'TXN_884911', date: '2026-06-30T11:15:00Z', risk: 'Elevated', score: 75.4, status: 'Investigating' },
  { id: 'CASE_48195', txId: 'TXN_884912', date: '2026-06-30T14:20:00Z', risk: 'High', score: 88.1, status: 'Open' },
  { id: 'CASE_48196', txId: 'TXN_884913', date: '2026-07-01T09:10:00Z', risk: 'Critical', score: 95.5, status: 'Open' },
  { id: 'CASE_48197', txId: 'TXN_884914', date: '2026-07-01T10:30:00Z', risk: 'Low', score: 25.0, status: 'Closed' },
  { id: 'CASE_48198', txId: 'TXN_884915', date: '2026-07-02T10:45:02Z', risk: 'Critical', score: 91.2, status: 'Open' },
  { id: 'CASE_48199', txId: 'TXN_884916', date: '2026-07-02T11:15:00Z', risk: 'Elevated', score: 72.4, status: 'Investigating' },
  { id: 'CASE_48200', txId: 'TXN_884917', date: '2026-07-02T14:20:00Z', risk: 'High', score: 82.1, status: 'Open' },
  { id: 'CASE_48201', txId: 'TXN_884918', date: '2026-07-03T09:10:00Z', risk: 'Critical', score: 99.5, status: 'Open' },
  { id: 'CASE_48202', txId: 'TXN_884919', date: '2026-07-03T10:30:00Z', risk: 'Low', score: 15.0, status: 'Closed' },
];

export function CasesTable() {
  const router = useRouter();
  const params = useParams();
  const selectedId = params?.id as string | undefined;
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const columns = [
    { 
      accessorKey: 'id', 
      header: 'ID',
      cell: ({ row }: { row: Row<MockCase> }) => <span className="font-mono text-xs">{row.getValue('id')}</span>
    },
    { 
      accessorKey: 'score', 
      header: 'Score',
      cell: ({ row }: { row: Row<MockCase> }) => {
        const s = row.getValue('score') as number;
        return (
          <span className={`font-mono text-xs font-semibold ${s > 90 ? 'text-destructive' : s > 80 ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {s.toFixed(1)}
          </span>
        );
      }
    },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }: { row: Row<MockCase> }) => (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.getValue('status')}</span>
      )
    }
  ];

  const table = useReactTable({
    data: mockCases,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting }
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-2 border-b shrink-0 bg-background">
        <Input placeholder="Filter (Cmd+K)..." className="h-7 text-xs bg-muted/50 focus-visible:ring-1" />
      </div>
      <div className="flex-1 overflow-auto bg-card">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isSelected = selectedId === row.getValue('id');
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected && "selected"}
                    className={`cursor-pointer transition-none border-b border-border/50 ${isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/50'}`}
                    onClick={() => router.push(`/cases/${row.getValue('id')}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-1.5 px-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
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
