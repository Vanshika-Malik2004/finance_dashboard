"use client";

import { useQuery } from "@tanstack/react-query";
import { getByPath } from "@/lib/jsonPath";

/**
 * Custom hook for fetching widget data with React Query
 * Handles API fetching, caching, and auto-refresh
 *
 * @param {Object} widget - Widget configuration object
 * @returns {Object} React Query result with additional processed data
 */
export function useWidgetData(widget) {
  const { id, apiUrl, dataPath, fields, refreshIntervalSec = 0 } = widget;

  const queryResult = useQuery({
    // Unique query key includes all factors that affect the data
    queryKey: ["widget-data", id, apiUrl, dataPath, JSON.stringify(fields)],

    // Fetch function
    queryFn: async () => {
      if (!apiUrl) {
        throw new Error("No API URL configured");
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `API Error (${response.status}): ${errorText.slice(0, 100)}`
        );
      }

      const json = await response.json();

      // Extract data using dataPath
      const extractedData = getByPath(json, dataPath);

      // Determine if data is a list or single object
      let list = [];
      let single = null;

      if (Array.isArray(extractedData)) {
        list = extractedData;
        single = extractedData[0] || null;
      } else if (extractedData && typeof extractedData === "object") {
        single = extractedData;
        list = [extractedData];
      } else if (extractedData !== undefined) {
        single = { value: extractedData };
        list = [single];
      }

      return {
        raw: json, // Original JSON response
        extracted: extractedData, // Data at dataPath
        list, // Array of items for tables/charts
        single, // Single item for cards
        timestamp: Date.now(),
      };
    },

    // Only fetch if we have an API URL
    enabled: Boolean(apiUrl),

    // Auto-refresh interval (convert seconds to milliseconds)
    refetchInterval: refreshIntervalSec > 0 ? refreshIntervalSec * 1000 : false,

    // Keep previous data while refetching
    placeholderData: (previousData) => previousData,

    // Stale time - consider data fresh for 10 seconds
    staleTime: 10 * 1000,

    // Don't retry too many times on error
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

    // Handle errors gracefully
    throwOnError: false,
  });

  // Process the data with field mappings if available
  const processedData = queryResult.data
    ? processDataWithFields(queryResult.data, fields)
    : null;

  return {
    ...queryResult,
    // Additional processed data
    list: processedData?.list || [],
    single: processedData?.single || null,
    raw: queryResult.data?.raw || null,
    // Convenience flags
    hasData: Boolean(processedData?.list?.length || processedData?.single),
    isEmpty:
      queryResult.isSuccess &&
      !processedData?.list?.length &&
      !processedData?.single,
  };
}

/**
 * Process data with field mappings
 * @param {Object} data - The fetched data object
 * @param {Array} fields - Field configuration array
 * @returns {Object} Processed data with field mappings applied
 */
function processDataWithFields(data, fields) {
  if (!data) return null;

  const { list, single } = data;

  // If no fields configured, return as-is
  if (!fields || fields.length === 0) {
    return { list, single };
  }

  // Process list items
  const processedList = list.map((item) => {
    const processed = {};
    for (const field of fields) {
      const value = getByPath(item, field.key);
      processed[field.key] = value;
      processed[`_${field.key}_raw`] = value; // Keep raw value
    }
    return { ...item, ...processed };
  });

  // Process single item
  const processedSingle = single ? { ...single } : null;
  if (processedSingle && fields) {
    for (const field of fields) {
      const value = getByPath(single, field.key);
      processedSingle[field.key] = value;
    }
  }

  return {
    list: processedList,
    single: processedSingle,
  };
}

/**
 * Hook for testing an API endpoint (used in configuration)
 * @param {string} url - API URL to test
 * @returns {Object} Query result for the test
 */
export function useApiTest(url, enabled = false) {
  return useQuery({
    queryKey: ["api-test", url],
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    enabled: enabled && Boolean(url),
    retry: 1,
    staleTime: 0,
    gcTime: 0,
  });
}

export default useWidgetData;
