"use client";

import { useMemo } from "react";
import { useApiData } from "./useApiData";
import { getByPath } from "@/lib/jsonPath";
import { normalizeData } from "../utils/normalizeData";

/**
 * Custom hook for fetching and processing widget data
 *
 * CACHING STRATEGY:
 * - Raw API responses are cached by URL (shared across widgets)
 * - Each widget processes/normalizes the cached data locally
 * - This reduces redundant API calls when multiple widgets use the same endpoint
 *
 * @param {Object} widget - Widget configuration object
 * @returns {Object} Processed data with React Query state
 */
export function useWidgetData(widget) {
  const { id, apiUrl, dataPath, fields, refreshIntervalSec = 0, type } = widget;

  // Use shared API cache - multiple widgets with same URL share this data
  const {
    data: apiResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useApiData(apiUrl, {
    refreshIntervalSec,
    enabled: Boolean(apiUrl),
    widgetId: id, // Track this widget's refresh interval
  });

  // Process the cached raw data for this specific widget
  // This runs locally and doesn't trigger new API calls
  const processedData = useMemo(() => {
    if (!apiResponse?.data) {
      return { list: [], single: null, raw: null };
    }

    const json = apiResponse.data;
    const extractedData = getByPath(json, dataPath);

    // Log for chart widgets (debugging)
    if (type === "chart") {
      console.log("[Chart Widget] Raw JSON response:", json);
    }

    // Normalize the data based on widget type
    const normalized = normalizeData({ ...widget, type }, extractedData, json);

    // Apply field mappings
    const withFields = processDataWithFields(normalized, fields);

    return {
      list: withFields?.list || [],
      single: withFields?.single || null,
      raw: json,
    };
  }, [apiResponse, dataPath, fields, type, widget]);

  const hasData = Boolean(processedData.list?.length || processedData.single);
  const isEmpty = !isLoading && !isError && !hasData;

  return {
    // Data
    list: processedData.list,
    single: processedData.single,
    raw: processedData.raw,

    // Query state
    isLoading: isLoading && !apiResponse,
    isError,
    error,
    refetch,
    isFetching,

    // Timestamps
    dataUpdatedAt,
    fetchedAt: apiResponse?.fetchedAt,

    // Convenience flags
    hasData,
    isEmpty,
  };
}

/**
 * Process data with field mappings
 * @param {Object} data - The normalized data object
 * @param {Array} fields - Field configuration array
 * @returns {Object} Processed data with field mappings applied
 */
function processDataWithFields(data, fields) {
  if (!data) return null;

  const { list = [], single = null } = data;

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
      processed[`_${field.key}_raw`] = value;
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
 * Uses separate cache to avoid polluting widget data cache
 *
 * @param {string} url - API URL to test
 * @param {boolean} enabled - Whether to run the test
 * @returns {Object} Query result for the test
 */
export function useApiTest(url, enabled = false) {
  return useApiData(url, {
    refreshIntervalSec: 0,
    enabled: enabled && Boolean(url),
  });
}

export default useWidgetData;
