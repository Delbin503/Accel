import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Skeleton } from "../ui/skeleton";
import { EmptyState } from "./EmptyState";
import { cn } from "../../lib/utils";

export interface DataTableColumn<T> {
  /** Stable key for the column. */
  key: string;
  header: React.ReactNode;
  /** Cell renderer. Defaults to String(row[key]). */
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  /** Classes for this column's body cells (and header, unless headClassName is set). */
  className?: string;
  /** Classes for this column's header cell only. */
  headClassName?: string;
  /**
   * The cell holds its own controls (menu, buttons, links): clicks and key
   * presses inside it don't trigger onRowClick.
   */
  stopRowClick?: boolean;
  /** Pin the column to the right edge while the table scrolls sideways. */
  sticky?: "right";
}

export interface DataTableSelection<T> {
  selectedIds: ReadonlySet<string> | readonly string[];
  onToggle: (id: string, row: T) => void;
  /** Called from the header checkbox: true = select every row, false = clear. */
  onToggleAll: (checked: boolean) => void;
  /** Accessible name of the header checkbox. Defaults to "Select all rows". */
  selectAllLabel?: string;
  /** Accessible name of a row's checkbox. Defaults to "Select row". */
  getRowLabel?: (row: T) => string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  /** Row click; rows also activate with Enter / Space when focused. */
  onRowClick?: (row: T) => void;
  /** Extra classes per row (status tint, unread, disabled…). */
  getRowClassName?: (row: T) => string | undefined;
  /**
   * `default` — shadcn table. `list` — the Accel list-page style: muted
   * header, mono uppercase eyebrow headers, px-4 cells, hairline dividers.
   */
  variant?: "default" | "list";
  /** Adds a leading checkbox column. */
  selection?: DataTableSelection<T>;
  /** Keep the header visible while the body scrolls. Give the scroll height via containerClassName (e.g. "max-h-96"). */
  stickyHeader?: boolean;
  isLoading?: boolean;
  skeletonRows?: number;
  /**
   * Shown when data is empty and not loading. `variant: "inline"` is a single
   * muted line, for tables inside cards or panels.
   */
  empty?: { icon?: LucideIcon; title: string; description?: React.ReactNode; variant?: "default" | "inline" };
  className?: string;
  /** Classes for the scroll container around the table. */
  containerClassName?: string;
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

const styles = {
  default: {
    table: "",
    header: "",
    headerRow: "",
    head: "",
    body: "",
    row: "",
    cell: "",
    // Opaque fills for sticky cells, matching the header / row hover / selected wash.
    headBg: "bg-card",
    stickyCell:
      "bg-card group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))] group-data-[state=selected]/row:bg-muted",
  },
  list: {
    table: "text-base",
    header: "bg-muted/30",
    headerRow: "border-b border-border hover:bg-transparent",
    head: "h-auto whitespace-normal px-4 py-2.5 font-mono text-2xs font-bold uppercase tracking-[0.15em] text-muted-foreground",
    body: "divide-y divide-border/60",
    row: "border-b-0 hover:bg-muted/20 data-[state=selected]:bg-muted/60",
    cell: "whitespace-normal px-4 py-3",
    headBg: "bg-[color-mix(in_oklab,var(--muted)_30%,var(--card))]",
    stickyCell:
      "bg-card group-hover/row:bg-[color-mix(in_oklab,var(--muted)_20%,var(--card))] group-data-[state=selected]/row:bg-[color-mix(in_oklab,var(--muted)_60%,var(--card))]",
  },
} as const;

const stickyRightClass = "sticky right-0 z-[var(--z-base)]";
const stopEvent = (e: React.SyntheticEvent) => e.stopPropagation();

/**
 * Generic, typed table built on the ui/Table primitive. Handles the loading,
 * empty and populated states, row click with keyboard activation, optional
 * row selection, sticky header and sticky right column.
 */
function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  getRowClassName,
  variant = "default",
  selection,
  stickyHeader = false,
  isLoading = false,
  skeletonRows = 5,
  empty,
  className,
  containerClassName,
}: DataTableProps<T>) {
  const s = styles[variant];
  const colCount = columns.length + (selection ? 1 : 0);

  const selectedSet = React.useMemo(
    () => (selection ? new Set<string>(selection.selectedIds) : new Set<string>()),
    [selection]
  );
  const selectedCount = data.reduce((n, row) => n + (selectedSet.has(getRowId(row)) ? 1 : 0), 0);
  const allChecked: boolean | "indeterminate" =
    data.length > 0 && selectedCount === data.length ? true : selectedCount > 0 ? "indeterminate" : false;

  const headSticky = stickyHeader && cn("sticky top-0 z-[var(--z-sticky)]", s.headBg);
  const colAlign = (col: DataTableColumn<T>) => col.align && alignClass[col.align];
  const cellClass = (col: DataTableColumn<T>) =>
    cn(s.cell, colAlign(col), col.sticky === "right" && cn(stickyRightClass, s.stickyCell), col.className);

  return (
    <Table
      data-slot="data-table"
      data-variant={variant}
      className={cn(s.table, className)}
      containerClassName={containerClassName}
    >
      <TableHeader data-slot="data-table-header" className={s.header}>
        <TableRow data-slot="data-table-header-row" className={s.headerRow}>
          {selection && (
            <TableHead data-slot="data-table-select-head" className={cn(s.head, "w-10", headSticky)}>
              <Checkbox
                data-slot="data-table-select-all"
                aria-label={selection.selectAllLabel ?? "Select all rows"}
                checked={allChecked}
                disabled={isLoading || data.length === 0}
                onCheckedChange={(c) => selection.onToggleAll(c === true)}
              />
            </TableHead>
          )}
          {columns.map((col) => (
            <TableHead
              data-slot="data-table-head"
              key={col.key}
              className={cn(
                s.head,
                colAlign(col),
                headSticky,
                col.sticky === "right" && cn(stickyRightClass, s.headBg, stickyHeader && "z-[var(--z-sticky)]"),
                col.headClassName ?? col.className
              )}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody data-slot="data-table-body" className={s.body}>
        {isLoading ? (
          Array.from({ length: skeletonRows }).map((_, i) => (
            <TableRow data-slot="data-table-skeleton-row" key={`sk-${i}`} className={cn("group/row", s.row)}>
              {selection && <TableCell data-slot="data-table-select-cell" className={cn(s.cell, "w-10")} />}
              {columns.map((col) => (
                <TableCell data-slot="data-table-cell" key={col.key} className={cellClass(col)}>
                  <Skeleton data-slot="data-table-skeleton" className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : data.length === 0 ? (
          <TableRow data-slot="data-table-empty-row" className={cn(s.row, "hover:bg-transparent")}>
            {empty?.variant === "inline" ? (
              <TableCell
                data-slot="data-table-empty-cell"
                colSpan={colCount}
                className="whitespace-normal px-4 py-8 text-center text-sm text-muted-foreground"
              >
                {empty.title}
                {empty.description && (
                  <span data-slot="data-table-empty-description" className="mt-1 block text-xs text-muted-foreground/70">
                    {empty.description}
                  </span>
                )}
              </TableCell>
            ) : (
              <TableCell data-slot="data-table-empty-cell" colSpan={colCount} className="p-0">
                <EmptyState
                  icon={empty?.icon}
                  title={empty?.title ?? "No results"}
                  description={empty?.description}
                />
              </TableCell>
            )}
          </TableRow>
        ) : (
          data.map((row) => {
            const id = getRowId(row);
            const selected = selectedSet.has(id);
            return (
              <TableRow
                data-slot="data-table-row"
                key={id}
                data-state={selected ? "selected" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "group/row",
                  s.row,
                  onRowClick &&
                    "group cursor-pointer outline-none focus-visible:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  getRowClassName?.(row)
                )}
              >
                {selection && (
                  <TableCell
                    data-slot="data-table-select-cell"
                    className={cn(s.cell, "w-10")}
                    onClick={stopEvent}
                    onKeyDown={stopEvent}
                  >
                    <Checkbox
                      data-slot="data-table-select"
                      aria-label={selection.getRowLabel?.(row) ?? "Select row"}
                      checked={selected}
                      onCheckedChange={() => selection.onToggle(id, row)}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell
                    data-slot="data-table-cell"
                    key={col.key}
                    className={cellClass(col)}
                    onClick={col.stopRowClick ? stopEvent : undefined}
                    onKeyDown={col.stopRowClick ? stopEvent : undefined}
                  >
                    {col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export { DataTable };
