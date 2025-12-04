import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Widget Shape Documentation:
 * {
 *   id: string,              // Unique identifier (UUID)
 *   name: string,            // Display name of the widget
 *   type: string,            // Widget type: 'table', 'card', or 'chart'
 *   symbol: string,          // Stock symbol (e.g., 'AAPL', 'GOOGL')
 *   apiUrl: string,          // Full API endpoint URL
 *   apiSource: string,       // API source: 'alphavantage', 'finnhub', etc.
 *   refreshIntervalSec: number, // Auto-refresh interval in seconds
 *   layoutOrder: number,     // Order in the dashboard grid (for drag-and-drop)
 *   selectedFields: [],      // Fields selected from API response to display
 *   position: { x, y },      // Grid position for drag-and-drop
 *   size: { w, h },          // Widget dimensions
 *   createdAt: string,       // ISO timestamp
 *   updatedAt: string,       // ISO timestamp
 * }
 */

// Generate unique ID
const generateId = () =>
  `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initial dummy widgets for development
const initialWidgets = [
  {
    id: generateId(),
    name: "Apple Stock Price",
    type: "card",
    symbol: "AAPL",
    apiUrl: "https://api.example.com/stock/AAPL",
    apiSource: "alphavantage",
    refreshIntervalSec: 60,
    layoutOrder: 0,
    selectedFields: ["price", "change", "changePercent"],
    position: { x: 0, y: 0 },
    size: { w: 1, h: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Tech Stocks Overview",
    type: "table",
    symbol: "MULTIPLE",
    apiUrl: "https://api.example.com/stocks/tech",
    apiSource: "finnhub",
    refreshIntervalSec: 30,
    layoutOrder: 1,
    selectedFields: ["symbol", "price", "volume", "high", "low"],
    position: { x: 1, y: 0 },
    size: { w: 2, h: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "S&P 500 Performance",
    type: "chart",
    symbol: "SPY",
    apiUrl: "https://api.example.com/stock/SPY/history",
    apiSource: "alphavantage",
    refreshIntervalSec: 120,
    layoutOrder: 2,
    selectedFields: ["timestamp", "close", "volume"],
    position: { x: 0, y: 1 },
    size: { w: 2, h: 2 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Dashboard Store using Zustand
 * Manages widget configurations and dashboard state
 * Persists to localStorage for session recovery
 */
const useDashboardStore = create(
  persist(
    (set, get) => ({
      // State
      widgets: initialWidgets,
      theme: "dark", // 'light' or 'dark'
      isLoading: false,
      error: null,

      // Widget Actions
      addWidget: (widget) =>
        set((state) => {
          const maxOrder = state.widgets.reduce(
            (max, w) => Math.max(max, w.layoutOrder || 0),
            -1
          );
          return {
            widgets: [
              ...state.widgets,
              {
                ...widget,
                id: widget.id || generateId(),
                layoutOrder: widget.layoutOrder ?? maxOrder + 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        }),

      removeWidget: (id) =>
        set((state) => {
          const filtered = state.widgets.filter((w) => w.id !== id);
          // Recompute layoutOrder after removal
          const reordered = filtered.map((w, index) => ({
            ...w,
            layoutOrder: index,
          }));
          return { widgets: reordered };
        }),

      updateWidget: (id, patch) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id
              ? { ...w, ...patch, updatedAt: new Date().toISOString() }
              : w
          ),
        })),

      // Reorder widgets (for drag-and-drop)
      // Accepts a new array of widgets with updated layoutOrder
      reorderWidgets: (newWidgets) =>
        set({
          widgets: newWidgets.map((w, index) => ({
            ...w,
            layoutOrder: index,
            updatedAt: new Date().toISOString(),
          })),
        }),

      // Get widgets sorted by layoutOrder
      getSortedWidgets: () => {
        const { widgets } = get();
        return [...widgets].sort(
          (a, b) => (a.layoutOrder || 0) - (b.layoutOrder || 0)
        );
      },

      // Theme Actions
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),

      setTheme: (theme) => set({ theme }),

      // Dashboard Actions
      clearDashboard: () => set({ widgets: [] }),

      resetToDefault: () => set({ widgets: initialWidgets }),

      // Export/Import Configuration
      exportConfig: () => {
        const { widgets, theme } = get();
        return JSON.stringify({
          widgets,
          theme,
          exportedAt: new Date().toISOString(),
        });
      },

      importConfig: (configJson) => {
        try {
          const config = JSON.parse(configJson);
          if (config.widgets && Array.isArray(config.widgets)) {
            set({
              widgets: config.widgets,
              theme: config.theme || "dark",
            });
            return { success: true };
          }
          return { success: false, error: "Invalid configuration format" };
        } catch (error) {
          return { success: false, error: "Failed to parse configuration" };
        }
      },

      // Loading/Error States
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "finboard-dashboard", // localStorage key
      partialize: (state) => ({
        widgets: state.widgets,
        theme: state.theme,
      }),
    }
  )
);

export default useDashboardStore;
