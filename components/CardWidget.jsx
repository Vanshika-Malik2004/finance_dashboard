"use client";

import { useMemo } from "react";
import { useWidgetData } from "@/hooks/useWidgetData";
import { getByPath, formatValue } from "@/lib/jsonPath";

/**
 * CardWidget Component
 * Displays key metrics in a compact card format with label-value pairs
 */
export default function CardWidget({ widget }) {
  const { single, list, isLoading, isError, error, hasData, isEmpty, refetch } =
    useWidgetData(widget);

  // Get the data item to display
  const dataItem = single || (list && list[0]) || null;

  // Get fields from widget config
  const fields = widget.fields || [];

  // Extract all field values
  const fieldValues = useMemo(() => {
    if (!dataItem || fields.length === 0) {
      return [];
    }

    return fields.map((field) => ({
      ...field,
      value: getByPath(dataItem, field.key),
    }));
  }, [dataItem, fields]);

  // Loading state
  if (isLoading && !hasData) {
    return <LoadingState />;
  }

  // Error state
  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // Empty state
  if (isEmpty || !dataItem) {
    return <EmptyState />;
  }

  // Helper to determine if a value is positive/negative (for styling percent fields)
  const getValueStyle = (field) => {
    if (
      field.format === "percent" ||
      field.key.toLowerCase().includes("change")
    ) {
      if (typeof field.value === "number" && field.value > 0) {
        return "text-emerald-400";
      }
      if (typeof field.value === "number" && field.value < 0) {
        return "text-red-400";
      }
    }
    return "text-zinc-100";
  };

  return (
    <div className="space-y-1">
      {/* All Fields as Label - Value pairs */}
      {fieldValues.map((field, index) => (
        <div
          key={field.key}
          className={`flex items-center justify-between py-2 ${
            index !== fieldValues.length - 1
              ? "border-b border-zinc-800/50"
              : ""
          }`}
        >
          <span className="text-sm text-zinc-400">{field.label}</span>
          <span
            className={`text-sm font-semibold font-mono ${getValueStyle(
              field
            )}`}
          >
            {formatValue(field.value, field.format)}
          </span>
        </div>
      ))}

      {/* Refreshing indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-1 pt-2 text-xs text-zinc-500">
          <svg
            className="animate-spin w-3 h-3"
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
          Updating...
        </div>
      )}
    </div>
  );
}

// Loading skeleton
function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="text-center">
        <div className="h-9 w-32 bg-zinc-800/50 rounded mx-auto" />
        <div className="h-5 w-20 bg-zinc-800/30 rounded mx-auto mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="h-16 bg-zinc-800/30 rounded-lg" />
        <div className="h-16 bg-zinc-800/30 rounded-lg" />
      </div>
    </div>
  );
}

// Error state
function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
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
      <p className="text-xs text-zinc-400 mb-2">
        {error?.message || "Failed to load"}
      </p>
      <button
        onClick={onRetry}
        className="px-2 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-zinc-500"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      </div>
      <p className="text-xs text-zinc-500">No data</p>
    </div>
  );
}
