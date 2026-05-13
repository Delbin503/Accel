import React from "react";
import { cn } from "utils/common";

export default function Pagination({
  // Standalone mode (existing - for backward compatibility)
  pagination,
  setPagination,
  type = "text",

  // Table integration mode (new)
  table = null,
  onPageChange = null,
  onPageSizeChange = null,

  // Styling
  theme = "light",  // "light" | "dark"
  className = "",
}) {
  // Detect mode
  const isTableMode = !!table;

  // Get pagination data based on mode
  const paginationData = isTableMode
    ? {
        currentPage: table.getState().pagination.pageIndex + 1,
        totalPages: table.getPageCount(),
        totalCount: table.getFilteredRowModel().rows.length,
        limit: table.getState().pagination.pageSize,
        hasNextPage: table.getCanNextPage(),
        hasPrevPage: table.getCanPreviousPage(),
      }
    : {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalCount: pagination.totalCount,
        limit: pagination.limit,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      };

  // Handlers
  const handleFirstPage = () => {
    if (isTableMode) {
      table.setPageIndex(0);
      onPageChange?.(1);
    } else if (paginationData.currentPage > 1) {
      setPagination({ ...pagination, currentPage: 1 });
    }
  };

  const handleLastPage = () => {
    if (isTableMode) {
      table.setPageIndex(table.getPageCount() - 1);
      onPageChange?.(table.getPageCount());
    } else if (paginationData.currentPage < paginationData.totalPages && paginationData.hasNextPage) {
      setPagination({ ...pagination, currentPage: paginationData.totalPages });
    }
  };

  const handleNextPage = () => {
    if (isTableMode) {
      table.nextPage();
      onPageChange?.(table.getState().pagination.pageIndex + 2);
    } else if (paginationData.hasNextPage) {
      setPagination({ ...pagination, currentPage: paginationData.currentPage + 1 });
    }
  };

  const handlePreviousPage = () => {
    if (isTableMode) {
      table.previousPage();
      onPageChange?.(table.getState().pagination.pageIndex);
    } else if (paginationData.hasPrevPage) {
      setPagination({ ...pagination, currentPage: paginationData.currentPage - 1 });
    }
  };

  const handleLimitChange = (e) => {
    const value = e.target.value;

    if (isTableMode) {
      if (value === "") {
        table.setPageSize(0);
        onPageSizeChange?.(0);
      } else {
        const newLimit = parseInt(value, 10);
        if (!isNaN(newLimit)) {
          table.setPageSize(newLimit);
          onPageSizeChange?.(newLimit);
        }
      }
    } else {
      // Standalone mode (existing behavior)
      if (value === "") {
        setPagination({ ...pagination, limit: 0 });
      } else {
        const newLimit = parseInt(value, 10);
        if (!isNaN(newLimit)) {
          setPagination({ ...pagination, limit: newLimit });
        }
      }
    }
  };

  const handleChangePage = (e) => {
    const value = e.target.value;

    if (isTableMode) {
      if (value === "") {
        table.setPageIndex(0);
        onPageChange?.(1);
      } else {
        const newPage = parseInt(value, 10);
        if (!isNaN(newPage) && newPage >= 1 && newPage <= paginationData.totalPages) {
          table.setPageIndex(newPage - 1);
          onPageChange?.(newPage);
        }
      }
    } else {
      // Standalone mode (existing behavior)
      if (value === "") {
        setPagination({ ...pagination, currentPage: 0 });
      } else {
        const newPage = parseInt(value, 10);
        if (!isNaN(newPage)) {
          setPagination({ ...pagination, currentPage: newPage });
        }
      }
    }
  };

  // Theme classes
  const themeClasses = theme === "dark"
    ? {
        container: "bg-surface",
        text: "text-gray-400",
        input: "bg-surface-elevated border-gray-700 text-white focus:border-brand focus:ring-0",
        button: "text-white hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        border: "border-gray-700",
      }
    : {
        container: "bg-white",
        text: "text-neutral-600",
        input: "bg-transparent border-neutral-400",
        button: "hover:bg-neutral-400 disabled:bg-transparent",
        border: "border-neutral-400",
      };

  // For backward compatibility with existing "text" type (simple mode)
  if (type === "text" && !isTableMode) {
    return (
      <div className={cn("flex w-full justify-between", className)}>
        <div className="flex items-center gap-4">
          <span className={themeClasses.text}>
            Showing {paginationData.limit * (paginationData.currentPage - 1) + 1}-
            {paginationData.limit * paginationData.currentPage > paginationData.totalCount
              ? paginationData.totalCount
              : paginationData.limit * paginationData.currentPage} of {paginationData.totalCount} Cameras
          </span>
        </div>

        <div className="flex gap-5">
          <div className={cn("flex divide-x overflow-hidden rounded-md border", themeClasses.border)}>
            <button
              className={cn("flex h-10 w-10 items-center justify-center", themeClasses.button)}
              onClick={handleFirstPage}
              disabled={!paginationData.hasPrevPage}
            >
              <img src="/icons/cheverons-left.svg" alt="First" />
            </button>
            <button
              className={cn("flex h-10 w-10 items-center justify-center", themeClasses.button)}
              onClick={handlePreviousPage}
              disabled={!paginationData.hasPrevPage}
            >
              <img src="/icons/cheveron-left.svg" alt="Previous" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              value={paginationData.currentPage}
              className={cn(
                "h-10 w-12 appearance-none rounded-md border px-2 text-center",
                themeClasses.input,
                "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              )}
              onChange={handleChangePage}
              disabled={paginationData.totalPages === 1}
            />
            <span className={themeClasses.text}>of {paginationData.totalPages}</span>
          </div>

          <div className={cn("flex divide-x overflow-hidden rounded-md border", themeClasses.border)}>
            <button
              className={cn("flex h-10 w-10 items-center justify-center", themeClasses.button)}
              onClick={handleNextPage}
              disabled={!paginationData.hasNextPage}
            >
              <img src="/icons/cheveron-right.svg" alt="Next" />
            </button>
            <button
              className={cn("flex h-10 w-10 items-center justify-center", themeClasses.button)}
              onClick={handleLastPage}
              disabled={!paginationData.hasNextPage}
            >
              <img src="/icons/cheverons-right.svg" alt="Last" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full pagination mode (default for Table integration and standalone full mode)
  return (
    <div className={cn("flex w-full items-center justify-between px-6 py-3", themeClasses.container, className)}>
      {/* Left: Entries per page + info */}
      <div className="flex items-center gap-3">
        <span className={cn("text-[14px]", themeClasses.text)}>Entries per page</span>

        <input
          type="number"
          min="1"
          value={paginationData.limit}
          className={cn(
            "h-[36px] w-[50px] rounded-[6px] border px-2 text-center text-[14px] focus:outline-none",
            themeClasses.input,
            "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          )}
          onChange={handleLimitChange}
        />

        <span className={cn("text-[14px]", themeClasses.text)}>
          {paginationData.limit * (paginationData.currentPage - 1) + 1}-
          {Math.min(paginationData.limit * paginationData.currentPage, paginationData.totalCount)} of {paginationData.totalCount} entries
        </span>
      </div>

      {/* Right: Navigation */}
      <div className="flex items-center gap-2">
        {/* First Page */}
        <button
          onClick={handleFirstPage}
          disabled={!paginationData.hasPrevPage}
          className={cn("flex h-[36px] w-[36px] items-center justify-center rounded-[6px] border border-neutral-700", themeClasses.button)}
        >
          {theme === "dark" ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <img src="/icons/cheverons-left.svg" alt="First" className="h-4 w-4" />
          )}
        </button>

        {/* Previous Page */}
        <button
          onClick={handlePreviousPage}
          disabled={!paginationData.hasPrevPage}
          className={cn("flex h-[36px] w-[36px] items-center justify-center rounded-[6px] border border-neutral-700", themeClasses.button)}
        >
          {theme === "dark" ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <img src="/icons/cheveron-left.svg" alt="Previous" className="h-4 w-4" />
          )}
        </button>

        {/* Page Number Input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max={paginationData.totalPages}
            value={paginationData.currentPage}
            className={cn(
              "h-[36px] w-[50px] rounded-[6px] border px-2 text-center text-[14px] focus:outline-none",
              themeClasses.input,
              "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            )}
            onChange={handleChangePage}
          />
          <span className={cn("text-[14px]", themeClasses.text)}>of {paginationData.totalPages}</span>
        </div>

        {/* Next Page */}
        <button
          onClick={handleNextPage}
          disabled={!paginationData.hasNextPage}
          className={cn("flex h-[36px] w-[36px] items-center justify-center rounded-[6px] border border-neutral-700", themeClasses.button)}
        >
          {theme === "dark" ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <img src="/icons/cheveron-right.svg" alt="Next" className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
