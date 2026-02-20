"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatNumber, formatMinutes } from "@/lib/utils";

export interface AggRow {
  topic?: string;
  brand?: string;
  video_count: number;
  total_views: number;
  total_watch_time: number;
  avg_views: number;
  avg_evergreen: number;
}

interface AggregationTableProps {
  data: AggRow[];
  labelKey: "topic" | "brand";
  labelHeader: string;
  onRowClick?: (value: string) => void;
}

export function AggregationTable({
  data,
  labelKey,
  labelHeader,
  onRowClick,
}: AggregationTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "total_views", desc: true },
  ]);

  const columns = useMemo<ColumnDef<AggRow>[]>(
    () => [
      {
        id: "label",
        accessorFn: (row) => row[labelKey],
        header: labelHeader,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <button
              onClick={() => onRowClick?.(val)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {val}
            </button>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "video_count",
        header: "Videos",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: "total_views",
        header: "Total Views",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{formatNumber(Number(getValue<number>()))}</span>
        ),
      },
      {
        accessorKey: "total_watch_time",
        header: "Watch Time",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{formatMinutes(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "avg_views",
        header: "Avg Views",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "avg_evergreen",
        header: "Avg Evergreen",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{Math.round(getValue<number>())}</span>
        ),
      },
    ],
    [labelKey, labelHeader, onRowClick]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ArrowUp className="h-3 w-3" />,
                        desc: <ArrowDown className="h-3 w-3" />,
                      }[header.column.getIsSorted() as string] ?? (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-12 text-center text-sm text-muted-foreground"
              >
                No data available yet. Sync your channel first.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
