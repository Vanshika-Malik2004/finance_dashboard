"use client";

import { useState } from "react";
import useDashboardStore from "@/store/dashboardStore";
import TableWidget from "./TableWidget";
import CardWidget from "./CardWidget";
import ChartWidget from "./ChartWidget";
import WidgetConfigModal from "./WidgetConfigModal";

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
  const [showConfig, setShowConfig] = useState(false);
  const { removeWidget, duplicateWidget } = useDashboardStore();

  // Render widget content based on type
  const renderWidgetContent = () => {
    switch (widget.type) {
      case "card":
        return <CardWidget widget={widget} />;
      case "table":
        return <TableWidget widget={widget} />;
      case "chart":
        return <ChartWidget widget={widget} />;
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
    <>
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
            {/* Configure Button */}
            <button
              onClick={() => setShowConfig(true)}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-400 hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Configure widget"
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
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

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
                      setShowConfig(true);
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
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Configure
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      duplicateWidget(widget.id);
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
            {widget.refreshIntervalSec > 0 ? "Live" : "Manual"}
          </span>
          <div className="flex items-center gap-3">
            {widget.refreshIntervalSec > 0 && (
              <span className="text-zinc-500">
                {widget.refreshIntervalSec}s
              </span>
            )}
            <span className="truncate max-w-[100px]">
              {widget.symbol || widget.apiSource || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <WidgetConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        widget={widget}
      />
    </>
  );
}
