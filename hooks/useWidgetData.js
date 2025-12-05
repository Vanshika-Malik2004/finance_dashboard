"use client";

import { useQuery } from "@tanstack/react-query";
import { getByPath } from "@/lib/jsonPath";
import { normalizeData } from "../utils/normalizeData"; // adjust path

/**
 * Custom hook for fetching widget data with React Query
 * Handles API fetching, caching, and auto-refresh
 *
 * @param {Object} widget - Widget configuration object
 * @returns {Object} React Query result with additional processed data
 */

export function useWidgetData(widget) {
  const { id, apiUrl, dataPath, fields, refreshIntervalSec = 0, type } = widget;

  const queryResult = useQuery({
    queryKey: ["widget-data", id, apiUrl, dataPath, JSON.stringify(fields)],
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
      const extractedData = getByPath(json, dataPath);

      // 🔥 Unified normalizer here:
      return normalizeData({ ...widget, type }, extractedData, json);
    },
    enabled: Boolean(apiUrl),
    refetchInterval: refreshIntervalSec > 0 ? refreshIntervalSec * 1000 : false,
    placeholderData: (previousData) => previousData,
    staleTime: 10 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    throwOnError: false,
  });

  const processedData = queryResult.data
    ? processDataWithFields(queryResult.data, fields)
    : null;

  return {
    ...queryResult,
    list: processedData?.list || [],
    single: processedData?.single || null,
    raw: queryResult.data?.raw || null,
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
