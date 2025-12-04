"use client";

import { useMemo } from "react";
import { useWidgetData } from "@/hooks/useWidgetData";
import { getByPath, formatValue } from "@/lib/jsonPath";

/**
 * CardWidget Component
 * Displays key metrics in a compact card format
 */
export default function CardWidget({ widget }) {
  const { single, list, isLoading, isError, error, hasData, isEmpty, refetch } =
    useWidgetData(widget);

  // Get the data item to display
  const dataItem = single || (list && list[0]) || null;

  // Get fields from widget config
  const fields = widget.fields || [];

  // Extract main value and secondary values
  const { mainValue, mainLabel, secondaryValues } = useMemo(() => {
    if (!dataItem || fields.length === 0) {
      return { mainValue: null, mainLabel: null, secondaryValues: [] };
    }

    const mainField = fields[0];
    const secondaryFields = fields.slice(1);

    return {
      mainValue: getByPath(dataItem, mainField.key),
      mainLabel: mainField.label,
      mainFormat: mainField.format,
      secondaryValues: secondaryFields.map((field) => ({
        ...field,
        value: getByPath(dataItem, field.key),
      })),
    };
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

  // Determine if change is positive/negative (for styling)
  const changeField = secondaryValues.find(
    (f) => f.format === "percent" || f.key.toLowerCase().includes("change")
  );
  const isPositive =
    changeField &&
    typeof changeField.value === "number" &&
    changeField.value > 0;
  const isNegative =
    changeField &&
    typeof changeField.value === "number" &&
    changeField.value < 0;

  return (
    <div className="space-y-4">
      {/* Main Value Display */}
      <div className="text-center">
        <div className="text-3xl font-bold text-zinc-100 tracking-tight font-mono">
          {formatValue(mainValue, fields[0]?.format || "currency")}
        </div>
        {changeField && (
          <div className="flex items-center justify-center gap-2 mt-1">
            <span
              className={`font-medium font-mono ${
                isPositive
                  ? "text-emerald-400"
                  : isNegative
                  ? "text-red-400"
                  : "text-zinc-400"
              }`}
            >
              {formatValue(changeField.value, changeField.format)}
            </span>
            {(isPositive || isNegative) && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isPositive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {isPositive ? "▲" : "▼"}
              </span>
            )}
          </div>
        )}
        {/* Refreshing indicator */}
        {isLoading && (
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-zinc-500">
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

      {/* Secondary Metrics */}
      {secondaryValues.length > 1 && (
        <div
          className={`grid grid-cols-${Math.min(
            secondaryValues.length - 1,
            2
          )} gap-3 pt-2`}
        >
          {secondaryValues
            .filter((f) => f !== changeField)
            .slice(0, 4)
            .map((field) => (
              <div
                key={field.key}
                className="bg-zinc-800/50 rounded-lg p-2.5 text-center"
              >
                <div className="text-xs text-zinc-500 uppercase tracking-wide">
                  {field.label}
                </div>
                <div className="text-sm font-semibold text-zinc-200 mt-0.5 font-mono">
                  {formatValue(field.value, field.format)}
                </div>
              </div>
            ))}
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
