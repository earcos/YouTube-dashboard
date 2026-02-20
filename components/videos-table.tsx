/* eslint-disable @next/next/no-img-element */
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
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { formatNumber, formatDate, formatDuration, formatMinutes, daysSince } from "@/lib/utils";
import { EvergreenBar } from "./evergreen-bar";
import { InlineEdit } from "./inline-edit";

export interface VideoRow {
  id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  duration_seconds: number;
  is_short: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  estimated_minutes_watched: number;
  average_view_duration: number;
  evergreen_score: number;
  topic: string | null;
  brand: string | null;
  topic_auto: boolean;
  brand_auto: boolean;
}

interface VideosTableProps {
  videos: VideoRow[];
  onUpdateField: (videoId: string, field: "topic" | "brand", value: string) => void;
  topicSuggestions: string[];
  brandSuggestions: string[];
  showEvergreen?: boolean;
}

export function VideosTable({
  videos,
  onUpdateField,
  topicSuggestions,
  brandSuggestions,
  showEvergreen = false,
}: VideosTableProps) {
  const [sorting, setSorting] = useState<SortingState>(
    showEvergreen
      ? [{ id: "evergreen_score", desc: true }]
      : [{ id: "view_count", desc: true }]
  );

  const columns = useMemo<ColumnDef<VideoRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Video",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-[280px]">
            <a
              href={`https://youtube.com/watch?v=${row.original.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex-shrink-0 overflow-hidden rounded"
            >
              {row.original.thumbnail_url ? (
                <img
                  src={row.original.thumbnail_url}
                  alt=""
                  width={80}
                  height={45}
                  className="h-[45px] w-[80px] object-cover"
                />
              ) : (
                <div className="flex h-[45px] w-[80px] items-center justify-center bg-muted text-xs text-muted-foreground">
                  No img
                </div>
              )}
              {row.original.is_short && (
                <span className="absolute bottom-0.5 right-0.5 rounded bg-rose-500 px-1 py-px text-[9px] font-bold text-rose-50 leading-tight">
                  SHORT
                </span>
              )}
            </a>
            <div className="flex flex-col gap-0.5 min-w-0">
              <a
                href={`https://youtube.com/watch?v=${row.original.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-card-foreground hover:text-primary truncate max-w-[300px] flex items-center gap-1"
              >
                <span className="truncate">{row.original.title}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover/row:opacity-100" />
              </a>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{formatDate(row.original.published_at)}</span>
                <span>{"/"}</span>
                <span>{formatDuration(row.original.duration_seconds)}</span>
                <span>{"/"}</span>
                <span>{daysSince(row.original.published_at)}d ago</span>
              </div>
            </div>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "view_count",
        header: "Views",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "like_count",
        header: "Likes",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "estimated_minutes_watched",
        header: "Watch Time",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{formatMinutes(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "evergreen_score",
        header: "Evergreen",
        cell: ({ getValue }) => <EvergreenBar score={getValue<number>()} />,
      },
      {
        id: "views_per_day",
        header: "Views/Day",
        accessorFn: (row) => {
          const days = daysSince(row.published_at);
          return days > 0 ? row.view_count / days : row.view_count;
        },
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {Math.round(getValue<number>()).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "topic",
        header: "Topic",
        cell: ({ row }) => (
          <InlineEdit
            value={row.original.topic}
            videoId={row.original.id}
            field="topic"
            onSave={onUpdateField}
            suggestions={topicSuggestions}
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "brand",
        header: "Brand",
        cell: ({ row }) => (
          <InlineEdit
            value={row.original.brand}
            videoId={row.original.id}
            field="brand"
            onSave={onUpdateField}
            suggestions={brandSuggestions}
          />
        ),
        enableSorting: false,
      },
    ],
    [onUpdateField, topicSuggestions, brandSuggestions]
  );

  const table = useReactTable({
    data: videos,
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
                No videos found. Connect your YouTube account and sync your data.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="group/row border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
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
