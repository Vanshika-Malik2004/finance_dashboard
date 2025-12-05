"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import useDashboardStore from "@/store/dashboardStore";

/**
 * Detect if an object is a time-series format (dates as keys with OHLCV data)
 */
function isTimeSeriesObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;

  const keys = Object.keys(obj);
  if (keys.length === 0) return false;

  const firstKey = keys[0];
  const firstValue = obj[firstKey];

  const looksLikeDate =
    /^\d{4}-\d{2}-\d{2}/.test(firstKey) ||
    /^\d{4}\/\d{2}\/\d{2}/.test(firstKey) ||
    !isNaN(Date.parse(firstKey));

  const hasOHLCVFields =
    firstValue &&
    typeof firstValue === "object" &&
    !Array.isArray(firstValue) &&
    (("1. open" in firstValue && "4. close" in firstValue) ||
      ("open" in firstValue && "close" in firstValue));

  return looksLikeDate && hasOHLCVFields;
}

/**
 * Extract chart-specific fields from time-series data
 */
function extractTimeSeriesFields(obj) {
  const keys = Object.keys(obj);
  if (keys.length === 0) return [];

  const firstValue = obj[keys[0]];
  if (!firstValue || typeof firstValue !== "object") return [];

  const innerKeys = Object.keys(firstValue);
  const fields = [];

  const alphaVantageMap = {
    "1. open": "open",
    "2. high": "high",
    "3. low": "low",
    "4. close": "close",
    "5. volume": "volume",
    "5. adjusted close": "adjusted_close",
    "6. volume": "volume",
  };

  for (const key of innerKeys) {
    const cleanName = alphaVantageMap[key] || key;
    const sampleValue = firstValue[key];

    fields.push({
      path: cleanName,
      originalKey: key,
      type: typeof sampleValue === "number" ? "number" : "string",
      value: String(sampleValue).slice(0, 20),
      isChartField: true,
    });
  }

  return fields;
}

/**
 * Recursively extracts all field paths from a JSON object
 */
function extractFieldPaths(obj, parentPath = "", results = []) {
  if (obj === null || obj === undefined) return results;

  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === "object") {
      extractFieldPaths(obj[0], parentPath, results);
    }
    if (parentPath) {
      results.push({
        path: parentPath,
        type: "array",
        value: `Array[${obj.length}]`,
        isArray: true,
      });
    }
  } else if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      const value = obj[key];

      if (value === null) {
        results.push({ path: currentPath, type: "null", value: "null" });
      } else if (Array.isArray(value)) {
        results.push({
          path: currentPath,
          type: "array",
          value: `Array[${value.length}]`,
          isArray: true,
        });
        if (value.length > 0) {
          extractFieldPaths(value[0], currentPath, results);
        }
      } else if (typeof value === "object") {
        const isTimeSeries = isTimeSeriesObject(value);
        results.push({
          path: currentPath,
          type: "object",
          value: isTimeSeries
            ? `TimeSeries[${Object.keys(value).length}]`
            : "{...}",
          isObject: true,
          isTimeSeries: isTimeSeries,
        });
        if (!isTimeSeries) {
          extractFieldPaths(value, currentPath, results);
        }
      } else {
        results.push({
          path: currentPath,
          type: typeof value,
          value: String(value).slice(0, 50),
        });
      }
    }
  }

  return results;
}

/**
 * Infer the format type based on the field path and value
 */
function inferFormat(path, value) {
  const lowerPath = path.toLowerCase();
  if (
    lowerPath.includes("price") ||
    lowerPath.includes("usd") ||
    lowerPath.includes("cost") ||
    lowerPath.includes("amount")
  ) {
    return "currency";
  }
  if (
    lowerPath.includes("percent") ||
    lowerPath.includes("change") ||
    lowerPath.includes("ratio")
  ) {
    return "percent";
  }
  if (typeof value === "number" || !isNaN(parseFloat(value))) {
    return "number";
  }
  return "string";
}

/**
 * WidgetConfigModal Component
 * Modal for configuring widget data source and field mappings
 */
export default function WidgetConfigModal({ isOpen, onClose, widget }) {
  const { updateWidget } = useDashboardStore();
  const [mounted, setMounted] = useState(false);

  // Form state
  const [apiUrl, setApiUrl] = useState(widget?.apiUrl || "");
  const [dataPath, setDataPath] = useState(widget?.dataPath || "");
  const [fields, setFields] = useState(widget?.fields || []);
  const [name, setName] = useState(widget?.name || "");
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(
    widget?.refreshIntervalSec || 60
  );

  // API test state
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(false);

  // Field selection state
  const [fieldSearch, setFieldSearch] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync form state when widget changes
  useEffect(() => {
    if (widget && isOpen) {
      setApiUrl(widget.apiUrl || "");
      setDataPath(widget.dataPath || "");
      setFields(widget.fields || []);
      setName(widget.name || "");
      setRefreshIntervalSec(widget.refreshIntervalSec || 60);
      setApiResponse(null);
      setApiError(null);
      setApiSuccess(false);
      setFieldSearch("");
    }
  }, [widget, isOpen]);

  // Extract available fields from API response
  const availableFields = useMemo(() => {
    if (!apiResponse) return [];
    return extractFieldPaths(apiResponse);
  }, [apiResponse]);

  // For charts: detect time-series data at the selected dataPath
  const chartFields = useMemo(() => {
    if (widget?.type !== "chart" || !apiResponse || !dataPath) return [];

    const pathParts = dataPath.split(".");
    let data = apiResponse;
    for (const part of pathParts) {
      if (data && typeof data === "object") {
        data = data[part];
      } else {
        return [];
      }
    }

    if (isTimeSeriesObject(data)) {
      return extractTimeSeriesFields(data);
    }

    return [];
  }, [widget?.type, dataPath, apiResponse]);

  const isTimeSeriesSelected = chartFields.length > 0;

  // Filter available fields
  const filteredFields = useMemo(() => {
    let fieldList = availableFields;

    const selectedPaths = fields.map((f) => f.key);
    fieldList = fieldList.filter((f) => !selectedPaths.includes(f.path));

    if (fieldSearch.trim()) {
      const search = fieldSearch.toLowerCase();
      fieldList = fieldList.filter((f) =>
        f.path.toLowerCase().includes(search)
      );
    }

    fieldList = fieldList.filter((f) => !f.isObject || f.isTimeSeries);

    return fieldList;
  }, [availableFields, fields, fieldSearch]);

  // Test API endpoint
  const handleTestApi = async () => {
    if (!apiUrl) return;

    setIsTestingApi(true);
    setApiError(null);
    setApiResponse(null);
    setApiSuccess(false);

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const json = await response.json();
      setApiResponse(json);
      setApiSuccess(true);
    } catch (error) {
      setApiError(error.message);
      setApiSuccess(false);
    } finally {
      setIsTestingApi(false);
    }
  };

  // Add a field from available fields
  const handleAddField = (field) => {
    const pathParts = field.path.split(".");
    const label = pathParts[pathParts.length - 1]
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    setFields((prev) => [
      ...prev,
      {
        key: field.path,
        label: label,
        format: inferFormat(field.path, field.value),
      },
    ]);
  };

  // Remove a field
  const removeField = (key) => {
    setFields(fields.filter((f) => f.key !== key));
  };

  // Update a field
  const updateField = (key, updates) => {
    setFields(fields.map((f) => (f.key === key ? { ...f, ...updates } : f)));
  };

  // Save configuration
  const handleSave = () => {
    updateWidget(widget.id, {
      name,
      apiUrl,
      dataPath: dataPath || null,
      fields,
      refreshIntervalSec,
    });
    onClose();
  };

  if (!mounted || !isOpen || !widget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-400"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                Configure Widget
              </h2>
              <p className="text-xs text-zinc-500">
                {widget.type.charAt(0).toUpperCase() + widget.type.slice(1)}{" "}
                Widget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Widget Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                value={refreshIntervalSec}
                onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
                min="0"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>
          </div>

          {/* API URL Section */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              API URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => {
                  setApiUrl(e.target.value);
                  setApiResponse(null);
                  setApiSuccess(false);
                }}
                placeholder="https://api.example.com/data"
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
              <button
                onClick={handleTestApi}
                disabled={!apiUrl || isTestingApi}
                className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-medium transition-colors flex items-center gap-2"
              >
                {isTestingApi ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Testing...
                  </>
                ) : (
                  "Test API"
                )}
              </button>
            </div>
            {apiError && (
              <p className="mt-2 text-sm text-red-400">{apiError}</p>
            )}
            {apiSuccess && (
              <p className="mt-2 text-sm text-emerald-400">
                ✓ API connection successful! Select fields below.
              </p>
            )}
          </div>

          {/* Data Path */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Data Path (optional - for nested data)
            </label>
            <input
              type="text"
              value={dataPath}
              onChange={(e) => setDataPath(e.target.value)}
              placeholder="e.g., data.items or Time Series (Daily)"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* Chart Time-Series Fields */}
          {widget?.type === "chart" && isTimeSeriesSelected && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-blue-400"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                <span className="text-sm font-medium text-blue-400">
                  Time-Series Data Detected
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Select which value to plot (Y-axis). Dates will be X-axis.
              </p>
              <div className="flex flex-wrap gap-2">
                {chartFields.map((field) => {
                  const isSelected =
                    fields.length > 1 && fields[1]?.key === field.path;
                  return (
                    <button
                      key={field.path}
                      type="button"
                      onClick={() => {
                        setFields([
                          {
                            key: "time",
                            label: "Date",
                            format: "string",
                            isChartField: true,
                          },
                          {
                            key: field.path,
                            originalKey: field.originalKey,
                            label:
                              field.path.charAt(0).toUpperCase() +
                              field.path.slice(1),
                            format: "number",
                            isChartField: true,
                          },
                        ]);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      <span className="capitalize">{field.path}</span>
                    </button>
                  );
                })}
              </div>
              {fields.length > 1 && fields[1]?.isChartField && (
                <div className="mt-3 pt-3 border-t border-blue-500/20 text-xs">
                  <span className="text-zinc-500">X-axis: </span>
                  <span className="text-zinc-300">Date</span>
                  <span className="text-zinc-500 ml-4">Y-axis: </span>
                  <span className="text-emerald-400">{fields[1].label}</span>
                </div>
              )}
            </div>
          )}

          {/* Available Fields - Show after API test */}
          {apiSuccess && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Available Fields
              </label>
              <input
                type="text"
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                placeholder="Search fields..."
                className="w-full px-3 py-2 mb-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800/50">
                {filteredFields.length > 0 ? (
                  filteredFields.slice(0, 30).map((field) => (
                    <div
                      key={field.path}
                      className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/50 last:border-b-0 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-zinc-200 font-mono truncate">
                          {field.path}
                          {field.isTimeSeries && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              Time-Series
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {field.type} | {field.value}
                        </div>
                      </div>
                      {field.isTimeSeries ? (
                        <button
                          type="button"
                          onClick={() => setDataPath(field.path)}
                          className={`ml-2 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            dataPath === field.path
                              ? "bg-emerald-500 text-zinc-900"
                              : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                          }`}
                        >
                          {dataPath === field.path ? "Selected" : "Use Path"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddField(field)}
                          className="ml-2 p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-zinc-500">
                    {fieldSearch ? "No fields match" : "No fields available"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Fields */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Selected Fields ({fields.length})
            </label>
            <div className="space-y-2">
              {fields.length > 0 ? (
                fields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800 border border-zinc-700"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-400 font-mono truncate">
                        {field.key}
                      </div>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.key, { label: e.target.value })
                        }
                        className="w-full mt-1 px-2 py-1 rounded bg-zinc-700 border border-zinc-600 text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        placeholder="Display label"
                      />
                    </div>
                    <select
                      value={field.format}
                      onChange={(e) =>
                        updateField(field.key, { format: e.target.value })
                      }
                      className="px-2 py-1 rounded bg-zinc-700 border border-zinc-600 text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="currency">Currency</option>
                      <option value="percent">Percent</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeField(field.key)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-zinc-500 rounded-lg border border-dashed border-zinc-700">
                  No fields selected. Test the API and click + to add fields.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-900 shadow-lg shadow-emerald-500/25 transition-all"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
