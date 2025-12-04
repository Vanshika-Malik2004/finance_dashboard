"use client";

import { useState, useMemo } from "react";
import useDashboardStore from "@/store/dashboardStore";
import DashboardGrid from "@/components/DashboardGrid";
import AddWidgetModal from "@/components/AddWidgetModal";

/**
 * FinBoard - Main Dashboard Page
 * Displays the finance dashboard with customizable widgets
 * Supports drag-and-drop reordering and widget management
 */
export default function Home() {
  const { widgets, addWidget, reorderWidgets, theme, toggleTheme } =
    useDashboardStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sort widgets by layoutOrder
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort(
      (a, b) => (a.layoutOrder || 0) - (b.layoutOrder || 0)
    );
  }, [widgets]);

  // Handle widget reorder after drag-and-drop
  const handleReorder = (newWidgets) => {
    reorderWidgets(newWidgets);
  };

  // Handle adding a new widget
  const handleAddWidget = (widget) => {
    addWidget(widget);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-100">
                  Fin<span className="text-emerald-400">Board</span>
                </h1>
                <p className="text-[10px] text-zinc-500 -mt-0.5 tracking-wide uppercase">
                  Real-Time Finance
                </p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Widget Count Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-zinc-500"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span className="text-sm text-zinc-400">
                  {widgets.length}{" "}
                  <span className="text-zinc-600">widgets</span>
                </span>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* Add Widget Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="
                  flex items-center gap-2 px-4 py-2.5 
                  bg-emerald-500 hover:bg-emerald-400 
                  text-zinc-900 font-semibold text-sm
                  rounded-xl shadow-lg shadow-emerald-500/25
                  transition-all duration-200
                  hover:shadow-emerald-500/40 hover:scale-[1.02]
                  active:scale-[0.98]
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="hidden sm:inline">Add Widget</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100">Dashboard</h2>
              <p className="text-zinc-500 mt-1">
                {widgets.length === 0
                  ? "No widgets configured"
                  : `${widgets.length} widget${
                      widgets.length !== 1 ? "s" : ""
                    } • Drag to reorder`}
              </p>
            </div>
          </div>
        </div>

        {/* Widget Grid or Empty State */}
        {sortedWidgets.length > 0 ? (
          <DashboardGrid widgets={sortedWidgets} onReorder={handleReorder} />
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-zinc-600"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-200 mb-2">
              No widgets yet
            </h3>
            <p className="text-zinc-500 text-center max-w-md mb-6">
              Get started by adding your first widget. Choose from cards,
              tables, or charts to visualize your financial data.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="
                flex items-center gap-2 px-6 py-3
                bg-emerald-500 hover:bg-emerald-400
                text-zinc-900 font-semibold
                rounded-xl shadow-lg shadow-emerald-500/25
                transition-all duration-200
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Your First Widget
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 bg-zinc-950/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Market data updates in real-time</span>
            </div>
            <div className="text-sm text-zinc-600">
              Built with Next.js, Tailwind CSS & Recharts
            </div>
          </div>
        </div>
      </footer>

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddWidget}
      />
    </div>
  );
}
