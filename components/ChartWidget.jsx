"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useWidgetData } from "@/hooks/useWidgetData";
import { getByPath, formatValue } from "@/lib/jsonPath";

/**
 * ChartWidget Component
 * Displays data visualization using Recharts
 */
export default function ChartWidget({ widget }) {
  const { list, isLoading, isError, error, hasData, isEmpty, refetch } =
    useWidgetData(widget);

  // Get fields - first is X axis, second is Y axis
  const fields = widget.fields || [];
  const xField = fields[0] || { key: "0", label: "X" };
  const yField = fields[1] || { key: "1", label: "Y" };

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!list || list.length === 0) return [];

    return list.map((item, index) => {
      // Handle array items (e.g., [[timestamp, price], ...])
      if (Array.isArray(item)) {
        const xValue = item[parseInt(xField.key) || 0];
        const yValue = item[parseInt(yField.key) || 1];
        return {
          x: formatXValue(xValue),
          y: typeof yValue === "number" ? yValue : parseFloat(yValue) || 0,
          rawX: xValue,
          rawY: yValue,
        };
      }

      // Handle object items
      const xValue = getByPath(item, xField.key);
      const yValue = getByPath(item, yField.key);
      return {
        x: formatXValue(xValue),
        y: typeof yValue === "number" ? yValue : parseFloat(yValue) || 0,
        rawX: xValue,
        rawY: yValue,
      };
    });
  }, [list, xField, yField]);

  // Calculate min/max for Y axis
  const { yMin, yMax, yDomain } = useMemo(() => {
    if (chartData.length === 0)
      return { yMin: 0, yMax: 100, yDomain: [0, 100] };

    const values = chartData.map((d) => d.y).filter((v) => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;

    return {
      yMin: min,
      yMax: max,
      yDomain: [min - padding, max + padding],
    };
  }, [chartData]);

  // Determine if trend is up or down
  const isUptrend = useMemo(() => {
    if (chartData.length < 2) return true;
    return chartData[chartData.length - 1].y >= chartData[0].y;
  }, [chartData]);

  // Loading state
  if (isLoading && !hasData) {
    return <LoadingState />;
  }

  // Error state
  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // Empty state
  if (isEmpty || chartData.length === 0) {
    return <EmptyState />;
  }

  const chartColor = isUptrend ? "#10b981" : "#ef4444";

  return (
    <div className="h-[200px] w-full relative">
      {/* Refreshing indicator */}
      {isLoading && (
        <div className="absolute top-0 right-0 z-10 flex items-center gap-1 text-xs text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded-bl">
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

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient
              id={`gradient-${widget.id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            vertical={false}
          />
          <XAxis
            dataKey="x"
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#3f3f46" }}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatYValue(value)}
            width={50}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload[0]) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
                  <div className="text-xs text-zinc-400">{data.x}</div>
                  <div className="text-sm font-semibold text-zinc-100 font-mono">
                    {formatValue(data.rawY, yField.format || "currency")}
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke={chartColor}
            strokeWidth={2}
            fill={`url(#gradient-${widget.id})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: chartColor,
              stroke: "#18181b",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Format X value (usually timestamp)
function formatXValue(value) {
  if (typeof value === "number" && value > 1e12) {
    // Unix timestamp in milliseconds
    const date = new Date(value);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (typeof value === "number" && value > 1e9) {
    // Unix timestamp in seconds
    const date = new Date(value * 1000);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (typeof value === "string") {
    // Try to parse as date
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }
  return String(value).slice(0, 10);
}

// Format Y value for axis
function formatYValue(value) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Loading skeleton
function LoadingState() {
  return (
    <div className="h-[200px] w-full bg-zinc-800/30 rounded-lg flex flex-col items-center justify-center animate-pulse">
      <div className="w-full h-full p-4">
        <div className="h-full w-full bg-zinc-800/50 rounded" />
      </div>
    </div>
  );
}

// Error state
function ErrorState({ error, onRetry }) {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center">
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
        {error?.message || "Failed to load chart"}
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
    <div className="h-[200px] flex flex-col items-center justify-center border border-dashed border-zinc-700 rounded-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-zinc-600 mb-3"
      >
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
      <p className="text-sm text-zinc-500">No chart data</p>
      <p className="text-xs text-zinc-600 mt-1">Configure data source</p>
    </div>
  );
}
