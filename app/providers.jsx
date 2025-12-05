"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * Providers component that wraps the entire application
 * Sets up React Query for intelligent data caching
 *
 * CACHING STRATEGY:
 * ─────────────────────────────────────────────────────────────────
 * 1. URL-Based Deduplication: Multiple widgets hitting the same API
 *    endpoint share a single cached response (see useApiData hook)
 *
 * 2. Stale Time: Data is considered "fresh" and won't be refetched
 *    - Default: 5 minutes for general queries
 *    - API Data: 30 seconds (configured in useApiData)
 *
 * 3. Garbage Collection: Unused cached data is kept for 30 minutes
 *    before being garbage collected
 *
 * 4. Configurable Refresh: Each widget can set its own refresh interval,
 *    which triggers automatic refetching for real-time updates
 *
 * 5. Smart Refetching: Window focus triggers refetch for stale data,
 *    keeping displayed data current
 * ─────────────────────────────────────────────────────────────────
 */
export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 minutes - data is considered fresh for this duration
            // Prevents unnecessary refetches when components remount
            staleTime: 5 * 60 * 1000,

            // Garbage collection time: 30 minutes
            // Unused data stays in cache, reducing API calls on navigation
            gcTime: 30 * 60 * 1000,

            // Retry configuration for resilience
            retry: 2,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),

            // Refetch on window focus - keeps data fresh when user returns
            refetchOnWindowFocus: "always",

            // Don't refetch on mount if data is fresh (within staleTime)
            refetchOnMount: false,

            // Don't refetch when network reconnects if data is fresh
            refetchOnReconnect: "always",

            // Use structural sharing to prevent unnecessary re-renders
            structuralSharing: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only visible in development - helps debug cache state */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
}
