"use no memo";
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Row,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
];

export function CasesTable() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const columns = [
    { accessorKey: 'id', header: 'Case ID' },
    { accessorKey: 'txId', header: 'Transaction ID' },
    { 
      accessorKey: 'date', 
      header: 'Generated At',
      cell: ({ row }: { row: Row<MockCase> }) => new Date(row.getValue('date')).toLocaleString()
    },
    { 
      accessorKey: 'risk', 
      header: 'Risk Tier',
      cell: ({ row }: { row: Row<MockCase> }) => {
        const val = row.getValue('risk') as string;
        const variant = val === 'Critical' ? 'destructive' : val === 'High' ? 'default' : 'secondary';
        return <Badge variant={variant}>{val}</Badge>;
      }
    },
    { accessorKey: 'score', header: 'Risk Score' },
    { accessorKey: 'status', header: 'Status' },
    {
      id: 'actions',
      cell: ({ row }: { row: Row<MockCase> }) => (
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation();
          router.push(`/cases/${row.getValue('id')}`);
        }}>
          Investigate
        </Button>
      )
    }
  ];
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: mockCases,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input placeholder="Filter cases..." className="max-w-sm" />
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/cases/${row.getValue('id')}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
