import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Widget Shape Documentation:
 * {
 *   id: string,                // Unique identifier (UUID)
 *   name: string,              // Display name of the widget
 *   type: string,              // Widget type: 'table', 'card', or 'chart'
 *   symbol: string,            // Stock symbol (e.g., 'AAPL', 'GOOGL')
 *   apiUrl: string,            // Full API endpoint URL
 *   apiSource: string,         // API source: 'alphavantage', 'finnhub', etc.
 *   refreshIntervalSec: number, // Auto-refresh interval in seconds
 *   layoutOrder: number,       // Order in the dashboard grid (for drag-and-drop)
 *   dataPath: string | null,   // JSON path to data array (e.g., "data.items")
 *   fields: Array<{            // Field mappings for display
 *     key: string,             // Key in the data object
 *     label: string,           // Display label
 *     format: 'string' | 'number' | 'currency' | 'percent'
 *   }>,
 *   displayMode: string,       // 'table', 'lineChart', 'barChart', etc.
 *   position: { x, y },        // Grid position for drag-and-drop
 *   size: { w, h },            // Widget dimensions
 *   createdAt: string,         // ISO timestamp
 *   updatedAt: string,         // ISO timestamp
 * }
 */

// Generate unique ID
const generateId = () =>
  `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Sample API URLs for demo - uses JSONPlaceholder and other free APIs
const DEMO_APIS = {
  users: "https://jsonplaceholder.typicode.com/users",
  posts: "https://jsonplaceholder.typicode.com/posts",
  crypto:
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1",
};

// Initial demo widgets with real API endpoints
const initialWidgets = [
  {
    id: generateId(),
    name: "Top Cryptocurrencies",
    type: "table",
    symbol: "CRYPTO",
    apiUrl: DEMO_APIS.crypto,
    apiSource: "coingecko",
    refreshIntervalSec: 60,
    layoutOrder: 0,
    dataPath: null, // Data is at root level
    fields: [
      { key: "symbol", label: "Symbol", format: "string" },
      { key: "current_price", label: "Price", format: "currency" },
      { key: "price_change_percentage_24h", label: "24h %", format: "percent" },
      { key: "market_cap", label: "Market Cap", format: "number" },
    ],
    displayMode: "table",
    position: { x: 0, y: 0 },
    size: { w: 2, h: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Bitcoin Price",
    type: "card",
    symbol: "BTC",
    apiUrl: "https://api.coingecko.com/api/v3/coins/bitcoin",
    apiSource: "coingecko",
    refreshIntervalSec: 30,
    layoutOrder: 1,
    dataPath: "market_data",
    fields: [
      { key: "current_price.usd", label: "Price", format: "currency" },
      {
        key: "price_change_percentage_24h",
        label: "24h Change",
        format: "percent",
      },
      { key: "high_24h.usd", label: "24h High", format: "currency" },
      { key: "low_24h.usd", label: "24h Low", format: "currency" },
    ],
    displayMode: "card",
    position: { x: 2, y: 0 },
    size: { w: 1, h: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "BTC Price History",
    type: "chart",
    symbol: "BTC",
    apiUrl:
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7",
    apiSource: "coingecko",
    refreshIntervalSec: 300,
    layoutOrder: 2,
    dataPath: "prices",
    fields: [
      { key: "0", label: "Time", format: "string" },
      { key: "1", label: "Price", format: "currency" },
    ],
    displayMode: "lineChart",
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
                dataPath: widget.dataPath ?? null,
                fields: widget.fields ?? [],
                displayMode: widget.displayMode ?? widget.type,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        }),

      removeWidget: (id) =>
        set((state) => {
          const filtered = state.widgets.filter((w) => w.id !== id);
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

      // Duplicate a widget
      duplicateWidget: (id) =>
        set((state) => {
          const widget = state.widgets.find((w) => w.id === id);
          if (!widget) return state;

          const maxOrder = state.widgets.reduce(
            (max, w) => Math.max(max, w.layoutOrder || 0),
            -1
          );

          return {
            widgets: [
              ...state.widgets,
              {
                ...widget,
                id: generateId(),
                name: `${widget.name} (Copy)`,
                layoutOrder: maxOrder + 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        }),

      // Reorder widgets (for drag-and-drop)
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
      name: "finboard-dashboard-v2", // New key to avoid conflicts with old data
      partialize: (state) => ({
        widgets: state.widgets,
        theme: state.theme,
      }),
    }
  )
);

export default useDashboardStore;
