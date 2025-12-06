"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  parseHttpError,
  parseNetworkError,
  detectApiResponseError,
  ErrorType,
} from "@/lib/errorUtils";

// Global registry to track refresh intervals per URL
// This enables smart interval selection across widgets
const refreshIntervalRegistry = new Map();

/**
 * Custom error class with additional metadata
 */
class ApiError extends Error {
  constructor(errorInfo) {
    super(errorInfo.message);
    this.name = "ApiError";
    this.type = errorInfo.type;
    this.detail = errorInfo.detail;
    this.retryAfter = errorInfo.retryAfter;
  }
}

/**
 * Register a refresh interval for a URL
 * @param {string} url - API URL
 * @param {string} widgetId - Unique widget identifier
 * @param {number} interval - Refresh interval in seconds
 */
function registerInterval(url, widgetId, interval) {
  if (!refreshIntervalRegistry.has(url)) {
    refreshIntervalRegistry.set(url, new Map());
  }
  refreshIntervalRegistry.get(url).set(widgetId, interval);
}

/**
 * Unregister a widget's refresh interval
 * @param {string} url - API URL
 * @param {string} widgetId - Unique widget identifier
 */
function unregisterInterval(url, widgetId) {
  if (refreshIntervalRegistry.has(url)) {
    refreshIntervalRegistry.get(url).delete(widgetId);
    if (refreshIntervalRegistry.get(url).size === 0) {
      refreshIntervalRegistry.delete(url);
    }
  }
}

/**
 * Get the shortest non-zero refresh interval for a URL
 * @param {string} url - API URL
 * @returns {number} Shortest interval in seconds (0 if none)
 */
function getShortestInterval(url) {
  if (!refreshIntervalRegistry.has(url)) return 0;

  const intervals = Array.from(refreshIntervalRegistry.get(url).values());
  const nonZeroIntervals = intervals.filter((i) => i > 0);

  if (nonZeroIntervals.length === 0) return 0;
  return Math.min(...nonZeroIntervals);
}

/**
 * Shared API data fetching hook with intelligent caching
 *
 * KEY FEATURES:
 * ─────────────────────────────────────────────────────────────────
 * 1. URL-Based Caching: Multiple widgets hitting the same endpoint
 *    share a single cached response, reducing redundant API calls
 *
 * 2. Smart Refresh Intervals: When multiple widgets use the same URL,
 *    the shortest non-zero refresh interval is used for all
 *
 * 3. Stale Time: 30 seconds - prevents excessive refetching
 *
 * 4. Automatic Cleanup: Intervals are unregistered on unmount
 * ─────────────────────────────────────────────────────────────────
 *
 * @param {string} apiUrl - The API endpoint to fetch
 * @param {Object} options - Configuration options
 * @param {number} options.refreshIntervalSec - Auto-refresh interval in seconds (0 = disabled)
 * @param {boolean} options.enabled - Whether to enable the query
 * @param {string} options.widgetId - Unique widget ID for interval tracking
 * @returns {Object} Query result with raw JSON data
 */
export function useApiData(apiUrl, options = {}) {
  const { refreshIntervalSec = 0, enabled = true, widgetId } = options;
  const queryClient = useQueryClient();

  // Generate a stable ID for this hook instance if not provided
  const instanceId = useRef(
    widgetId || `hook-${Math.random().toString(36).slice(2)}`
  );

  // Register/update this widget's refresh interval
  useEffect(() => {
    if (apiUrl && enabled) {
      registerInterval(apiUrl, instanceId.current, refreshIntervalSec);

      // Trigger a refetch to update the interval if needed
      queryClient.invalidateQueries({
        queryKey: ["api-data", apiUrl],
        refetchType: "none", // Don't actually refetch, just update
      });
    }

    return () => {
      if (apiUrl) {
        unregisterInterval(apiUrl, instanceId.current);
      }
    };
  }, [apiUrl, refreshIntervalSec, enabled, queryClient]);

  // Get the effective (shortest) refresh interval for this URL
  const effectiveInterval = getShortestInterval(apiUrl);

  return useQuery({
    // Cache key is ONLY the API URL - enables sharing across widgets
    queryKey: ["api-data", apiUrl],

    queryFn: async () => {
      if (!apiUrl) {
        throw new ApiError({
          type: ErrorType.INVALID_DATA,
          message: "No API URL configured",
          detail: "Please configure an API URL for this widget.",
        });
      }

      console.log(`[API Cache] Fetching: ${apiUrl}`);

      let response;
      try {
        response = await fetch(apiUrl);
      } catch (fetchError) {
        // Network error (no response at all)
        const errorInfo = parseNetworkError(fetchError);
        throw new ApiError(errorInfo);
      }

      // Get response body
      const responseText = await response.text().catch(() => "");

      // Check for HTTP errors
      if (!response.ok) {
        const errorInfo = parseHttpError(
          response.status,
          response.statusText,
          responseText
        );
        throw new ApiError(errorInfo);
      }

      // Parse JSON
      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        throw new ApiError({
          type: ErrorType.INVALID_DATA,
          message: "Invalid response",
          detail: "The API returned data that couldn't be parsed as JSON.",
        });
      }

      // Check for API-specific errors in response body
      // (Some APIs like Alpha Vantage return 200 with error in body)
      const bodyError = detectApiResponseError(json);
      if (bodyError) {
        throw new ApiError(bodyError);
      }

      return {
        data: json,
        fetchedAt: Date.now(),
      };
    },

    enabled: enabled && Boolean(apiUrl),

    // Use the shortest refresh interval among all widgets using this URL
    refetchInterval: effectiveInterval > 0 ? effectiveInterval * 1000 : false,

    // Keep previous data while refetching for smooth UX
    placeholderData: (previousData) => previousData,

    // Stale time: 30 seconds - prevents excessive refetching
    staleTime: 30 * 1000,

    // Smart retry logic - don't retry on certain errors
    retry: (failureCount, error) => {
      // Don't retry rate limits, auth errors, or not found
      if (error?.type === ErrorType.RATE_LIMIT) return false;
      if (error?.type === ErrorType.AUTH_ERROR) return false;
      if (error?.type === ErrorType.NOT_FOUND) return false;
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

    throwOnError: false,
  });
}

/**
 * Hook to manually refresh data for a specific API URL
 * Useful for "refresh" buttons on widgets
 *
 * @param {string} apiUrl - The API URL to refresh
 * @returns {Function} Refetch function
 */
export function useRefreshApi(apiUrl) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["api-data", apiUrl] });
  };
}

/**
 * Hook to prefetch API data (useful for preloading)
 *
 * @param {string} apiUrl - The API URL to prefetch
 */
export function usePrefetchApi(apiUrl) {
  const queryClient = useQueryClient();

  return () => {
    if (apiUrl) {
      queryClient.prefetchQuery({
        queryKey: ["api-data", apiUrl],
        queryFn: async () => {
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return { data: await response.json(), fetchedAt: Date.now() };
        },
        staleTime: 30 * 1000,
      });
    }
  };
}

export default useApiData;
