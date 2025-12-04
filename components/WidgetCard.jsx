"use client";

import { useState } from "react";
import useDashboardStore from "@/store/dashboardStore";

/**
 * WidgetCard Component
 * Renders individual dashboard widgets based on their type
 * Supports: card, table, and chart widget types
 * Includes drag handle for reordering
 */
export default function WidgetCard({
  widget,
  dragHandleProps = {},
  isDragging = false,
  isDragOverlay = false,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const { removeWidget } = useDashboardStore();

  // Render widget content based on type
  const renderWidgetContent = () => {
    switch (widget.type) {
      case "card":
        return <CardWidgetContent widget={widget} />;
      case "table":
        return <TableWidgetContent widget={widget} />;
      case "chart":
        return <ChartWidgetContent widget={widget} />;
      default:
        return (
          <div className="text-zinc-500 text-center py-8">
            Unknown widget type
          </div>
        );
    }
  };

  // Get type-specific styling
  const getTypeStyles = () => {
    switch (widget.type) {
      case "card":
        return "col-span-1";
      case "table":
        return "col-span-1 md:col-span-2";
      case "chart":
        return "col-span-1 md:col-span-2 lg:col-span-2 min-h-[300px]";
      default:
        return "col-span-1";
    }
  };

  return (
    <div
      className={`
        relative group
        bg-zinc-900/80 backdrop-blur-sm
        border border-zinc-800 
        ${
          isDragging
            ? "border-emerald-500/50 shadow-emerald-500/20"
            : "hover:border-zinc-700"
        }
        rounded-xl shadow-lg
        transition-all duration-300 ease-out
        ${
          isDragging
            ? "shadow-2xl scale-[1.02]"
            : "hover:shadow-xl hover:shadow-emerald-500/5"
        }
        ${isDragOverlay ? "cursor-grabbing" : ""}
        ${getTypeStyles()}
      `}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            {...dragHandleProps}
            className={`
              p-1 rounded-md text-zinc-600 
              hover:text-zinc-400 hover:bg-zinc-800
              transition-colors cursor-grab active:cursor-grabbing
              ${isDragOverlay ? "cursor-grabbing" : ""}
            `}
            aria-label="Drag to reorder"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="9" cy="5" r="1.5" />
              <circle cx="15" cy="5" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="19" r="1.5" />
              <circle cx="15" cy="19" r="1.5" />
            </svg>
          </button>

          {/* Type Indicator */}
          <span
            className={`
              w-2 h-2 rounded-full
              ${widget.type === "card" ? "bg-emerald-500" : ""}
              ${widget.type === "table" ? "bg-blue-500" : ""}
              ${widget.type === "chart" ? "bg-amber-500" : ""}
            `}
          />
          <h3 className="text-sm font-semibold text-zinc-100 truncate max-w-[150px]">
            {widget.name}
          </h3>
        </div>

        {/* Actions Menu */}
        <div className="relative flex items-center gap-1">
          {/* Quick Delete Button */}
          <button
            onClick={() => removeWidget(widget.id)}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete widget"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* More Actions Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label="Widget actions"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && !isDragOverlay && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-40 py-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // Edit functionality to be added
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // Duplicate functionality
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // Refresh functionality to be added
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 2v6h-6" />
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                    <path d="M3 22v-6h6" />
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                  Refresh
                </button>
                <hr className="my-1 border-zinc-700" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    removeWidget(widget.id);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Widget Body */}
      <div className="p-4">{renderWidgetContent()}</div>

      {/* Widget Footer - Meta info */}
      <div className="px-4 py-2 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-600">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">
            {widget.refreshIntervalSec || 60}s
          </span>
          <span>{widget.symbol}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Card Widget Content
 * Displays key metrics in a compact card format
 */
function CardWidgetContent({ widget }) {
  // Dummy data for demonstration
  const dummyData = {
    price: "$178.72",
    change: "+2.34",
    changePercent: "+1.32%",
    high: "$180.12",
    low: "$176.45",
  };

  return (
    <div className="space-y-4">
      {/* Main Price Display */}
      <div className="text-center">
        <div className="text-3xl font-bold text-zinc-100 tracking-tight font-mono">
          {dummyData.price}
        </div>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-emerald-400 font-medium font-mono">
            {dummyData.change}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
            {dummyData.changePercent}
          </span>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wide">
            High
          </div>
          <div className="text-sm font-semibold text-zinc-200 mt-0.5 font-mono">
            {dummyData.high}
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wide">
            Low
          </div>
          <div className="text-sm font-semibold text-zinc-200 mt-0.5 font-mono">
            {dummyData.low}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Table Widget Content
 * Displays data in a tabular format
 */
function TableWidgetContent({ widget }) {
  // Dummy data for demonstration
  const dummyData = [
    {
      symbol: "AAPL",
      price: "$178.72",
      volume: "52.3M",
      high: "$180.12",
      low: "$176.45",
    },
    {
      symbol: "GOOGL",
      price: "$141.80",
      volume: "21.1M",
      high: "$143.22",
      low: "$140.50",
    },
    {
      symbol: "MSFT",
      price: "$378.91",
      volume: "18.7M",
      high: "$381.45",
      low: "$375.20",
    },
    {
      symbol: "AMZN",
      price: "$178.25",
      volume: "31.2M",
      high: "$180.00",
      low: "$176.80",
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-zinc-500 text-xs uppercase tracking-wider">
            <th className="text-left pb-3 font-medium">Symbol</th>
            <th className="text-right pb-3 font-medium">Price</th>
            <th className="text-right pb-3 font-medium hidden sm:table-cell">
              Volume
            </th>
            <th className="text-right pb-3 font-medium hidden md:table-cell">
              High
            </th>
            <th className="text-right pb-3 font-medium hidden md:table-cell">
              Low
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {dummyData.map((row) => (
            <tr
              key={row.symbol}
              className="hover:bg-zinc-800/30 transition-colors"
            >
              <td className="py-2.5 font-semibold text-zinc-100">
                {row.symbol}
              </td>
              <td className="py-2.5 text-right text-zinc-200 font-mono">
                {row.price}
              </td>
              <td className="py-2.5 text-right text-zinc-400 hidden sm:table-cell font-mono">
                {row.volume}
              </td>
              <td className="py-2.5 text-right text-emerald-400 hidden md:table-cell font-mono">
                {row.high}
              </td>
              <td className="py-2.5 text-right text-red-400 hidden md:table-cell font-mono">
                {row.low}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Chart Widget Content
 * Displays data visualization using Recharts
 */
function ChartWidgetContent({ widget }) {
  // Dummy chart data
  const dummyData = [
    { time: "9:30", price: 448.5 },
    { time: "10:00", price: 450.2 },
    { time: "10:30", price: 449.8 },
    { time: "11:00", price: 452.1 },
    { time: "11:30", price: 454.3 },
    { time: "12:00", price: 453.7 },
    { time: "12:30", price: 455.9 },
    { time: "13:00", price: 457.2 },
    { time: "13:30", price: 456.8 },
    { time: "14:00", price: 458.4 },
    { time: "14:30", price: 460.1 },
    { time: "15:00", price: 459.5 },
  ];

  return (
    <div className="h-[200px] flex items-center justify-center">
      {/* Placeholder for chart - will be implemented with Recharts */}
      <div className="w-full h-full bg-zinc-800/30 rounded-lg flex flex-col items-center justify-center border border-dashed border-zinc-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
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
        <span className="text-sm text-zinc-500">Chart Widget</span>
        <span className="text-xs text-zinc-600 mt-1">
          Real-time chart visualization
        </span>
      </div>
    </div>
  );
}
