"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * Providers component that wraps the entire application
 * Sets up React Query for data fetching and caching
 */
export default function Providers({ children }) {
  // Create QueryClient instance with default options
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 minutes - data is considered fresh for this duration
            staleTime: 5 * 60 * 1000,
            // Cache time: 30 minutes - unused data stays in cache
            gcTime: 30 * 60 * 1000,
            // Retry failed requests 2 times
            retry: 2,
            // Refetch on window focus for real-time data
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only visible in development */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
}
