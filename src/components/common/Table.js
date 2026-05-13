import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { cn } from "utils/common";
import Pagination from "components/pagination/pagination";
import EmptyState from "components/common/EmptyState";

const Table = ({
  columns,
  data,
  onRowClick,
  renderActions,
  pagination = true,
  initialPageSize = 10,

  // Server-side pagination props
  manualPagination = false,
  totalCount = 0,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,

  // Layout props
  maxHeight = "calc(100vh - 200px)",  // Configurable container height
  minHeight = "300px",                 // Minimum height
  height = null,                       // Fixed height (overrides maxHeight)
  stickyHeader = true,                 // Enable sticky header

  // Styling props
  className = "",
  tableClassName = "",
  theadClassName = "",
  tbodyClassName = "",
  headerRowClassName = "",
  headerCellClassName = "",
  rowClassName = "",
  cellClassName = "",
  paginationClassName = "",
}) => {
  const [sorting, setSorting] = useState([]);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex: manualPagination ? currentPage - 1 : undefined,
        pageSize: manualPagination ? initialPageSize : internalPageSize,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(manualPagination
      ? {
          manualPagination: true,
          pageCount: Math.ceil(totalCount / initialPageSize),
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
        }),
  });

  // Determine container style
  const containerStyle = height
    ? { height, minHeight }
    : { maxHeight, minHeight };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-neutral-700 bg-surface",
        className
      )}
      style={containerStyle}
    >
      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto">
        <table className={cn("w-full min-w-[1000px]", tableClassName)}>
          <thead className={cn(
            stickyHeader && "sticky top-0 z-20",
            "whitespace-nowrap bg-neutral-700",
            theadClassName
          )}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className={cn("border-b border-neutral-700", headerRowClassName)}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "cursor-pointer select-none px-6 py-4 text-left text-sm font-medium text-gray-400",
                      headerCellClassName
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-2">
                      <span>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      {header.column.getCanSort() && (
                        <span className="text-gray-500">
                          {{
                            asc: "↑",
                            desc: "↓",
                          }[header.column.getIsSorted()] ?? "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {renderActions && (
                  <th
                    className={cn(
                      "sticky right-0 z-10 bg-neutral-700 px-6 py-4 text-left text-sm font-medium text-gray-400",
                      headerCellClassName
                    )}
                  >
                    Action
                  </th>
                )}
              </tr>
            ))}
          </thead>
          <tbody className={cn("", tbodyClassName)}>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "group border-b border-neutral-700 transition-colors hover:bg-surface-elevated",
                    rowClassName
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn("whitespace-nowrap px-6 py-4 text-textPrimary", cellClassName)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  {renderActions && (
                    <td
                      className="sticky right-0 z-10 bg-surface px-6 py-4 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.3)] transition-colors group-hover:bg-surface-elevated"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderActions(row.original)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                >
                  <EmptyState icon="cursor" message="There's nothing to show here at the moment." className="py-16" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky Pagination Footer - Use Pagination component */}
      {pagination && (manualPagination ? totalCount > 0 : data.length > 0) && (
        <div className={cn(
          "flex-shrink-0 border-t border-neutral-700",
          paginationClassName
        )}>
          <Pagination
            table={table}
            theme="dark"
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
};

export default Table;
