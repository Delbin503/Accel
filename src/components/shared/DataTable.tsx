import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  /** Stable key for the column. */
  key: string;
  header: React.ReactNode;
  /** Cell renderer. Defaults to String(row[key]). */
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  skeletonRows?: number;
  /** Empty-state config shown when data is empty and not loading. */
  empty?: { icon?: LucideIcon; title: string; description?: React.ReactNode };
  className?: string;
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

/**
 * Generic, typed table built on the ui/Table primitive. Handles the loading,
 * empty and populated states so list pages stop re-implementing them.
 */
function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  isLoading = false,
  skeletonRows = 5,
  empty,
  className,
}: DataTableProps<T>) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key} className={cn(col.align && alignClass[col.align], col.className)}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: skeletonRows }).map((_, i) => (
            <TableRow key={`sk-${i}`}>
              {columns.map((col) => (
                <TableCell key={col.key} className={cn(col.align && alignClass[col.align], col.className)}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : data.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="p-0">
              <EmptyState
                icon={empty?.icon}
                title={empty?.title ?? "No results"}
                description={empty?.description}
              />
            </TableCell>
          </TableRow>
        ) : (
          data.map((row) => (
            <TableRow
              key={getRowId(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && "cursor-pointer")}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={cn(col.align && alignClass[col.align], col.className)}>
                  {col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export { DataTable };
