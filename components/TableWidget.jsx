"use client";

import { useState, useMemo } from "react";
import { useWidgetData } from "@/hooks/useWidgetData";
import { getByPath, formatValue } from "@/lib/jsonPath";

/**
 * TableWidget Component
 * Displays data in a tabular format with search and pagination
 */
export default function TableWidget({ widget }) {
  const { list, isLoading, isError, error, hasData, isEmpty, refetch } =
    useWidgetData(widget);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Get fields from widget or generate from first item
  const fields = useMemo(() => {
    if (widget.fields && widget.fields.length > 0) {
      return widget.fields;
    }
    // Auto-generate fields from first item
    if (list.length > 0) {
      const firstItem = list[0];
      return Object.keys(firstItem)
        .slice(0, 6)
        .map((key) => ({
          key,
          label: formatLabel(key),
          format: "string",
        }));
    }
    return [];
  }, [widget.fields, list]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter((item) =>
      fields.some((field) => {
        const value = getByPath(item, field.key);
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [list, searchQuery, fields]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Reset to page 1 when search changes
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Loading state
  if (isLoading && !hasData) {
    return <LoadingState />;
  }

  // Error state
  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // Empty state
  if (isEmpty || fields.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin w-4 h-4 text-emerald-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs uppercase tracking-wider">
              {fields.map((field) => (
                <th
                  key={field.key}
                  className={`pb-3 font-medium ${
                    field.format === "number" ||
                    field.format === "currency" ||
                    field.format === "percent"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                {fields.map((field, fieldIndex) => {
                  const value = getByPath(row, field.key);
                  const formatted = formatValue(value, field.format);
                  const isPositive =
                    field.format === "percent" &&
                    typeof value === "number" &&
                    value > 0;
                  const isNegative =
                    field.format === "percent" &&
                    typeof value === "number" &&
                    value < 0;

                  return (
                    <td
                      key={field.key}
                      className={`py-2.5 ${
                        field.format === "number" ||
                        field.format === "currency" ||
                        field.format === "percent"
                          ? "text-right font-mono"
                          : "text-left"
                      } ${
                        fieldIndex === 0
                          ? "font-semibold text-zinc-100"
                          : "text-zinc-300"
                      }
                      ${isPositive ? "text-emerald-400" : ""}
                      ${isNegative ? "text-red-400" : ""}
                      `}
                    >
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-xs text-zinc-500">
            Showing {(currentPage - 1) * rowsPerPage + 1}-
            {Math.min(currentPage * rowsPerPage, filteredData.length)} of{" "}
            {filteredData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="px-3 text-sm text-zinc-400">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading skeleton
function LoadingState() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-9 bg-zinc-800/50 rounded-lg" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-zinc-800/30 rounded" />
        ))}
      </div>
    </div>
  );
}

// Error state
function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-red-400"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <p className="text-sm text-zinc-400 mb-3">
        {error?.message || "Failed to load data"}
      </p>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-zinc-500"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18" />
        </svg>
      </div>
      <p className="text-sm text-zinc-500">No data available</p>
      <p className="text-xs text-zinc-600 mt-1">
        Configure the widget to display data
      </p>
    </div>
  );
}

// Format key to label
function formatLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
