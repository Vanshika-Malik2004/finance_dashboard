"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Recursively extracts all field paths from a JSON object
 * Returns an array of { path, type, value } objects
 */
function extractFieldPaths(obj, parentPath = "", results = []) {
  if (obj === null || obj === undefined) return results;

  if (Array.isArray(obj)) {
    // For arrays, sample the first item to get structure
    if (obj.length > 0 && typeof obj[0] === "object") {
      extractFieldPaths(obj[0], parentPath, results);
    }
    // Also mark the array itself as a path
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
        // Recurse into array items
        if (value.length > 0) {
          extractFieldPaths(value[0], currentPath, results);
        }
      } else if (typeof value === "object") {
        results.push({
          path: currentPath,
          type: "object",
          value: "{...}",
          isObject: true,
        });
        extractFieldPaths(value, currentPath, results);
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
 * AddWidgetModal Component
 * Modal form for creating new dashboard widgets
 * Supports API testing and dynamic field selection
 */
export default function AddWidgetModal({ isOpen, onClose, onAdd }) {
  const [mounted, setMounted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "card",
    apiUrl: "",
    refreshIntervalSec: 60,
    dataPath: "",
  });

  // API testing state
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(false);

  // Field selection state
  const [selectedFields, setSelectedFields] = useState([]);
  const [fieldSearch, setFieldSearch] = useState("");
  const [showArraysOnly, setShowArraysOnly] = useState(false);

  const [errors, setErrors] = useState({});

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Extract available fields from API response
  const availableFields = useMemo(() => {
    if (!apiResponse) return [];
    return extractFieldPaths(apiResponse);
  }, [apiResponse]);

  // Filter available fields based on search and filters
  const filteredFields = useMemo(() => {
    let fields = availableFields;

    // Filter out already selected fields
    const selectedPaths = selectedFields.map((f) => f.key);
    fields = fields.filter((f) => !selectedPaths.includes(f.path));

    // Apply search filter
    if (fieldSearch.trim()) {
      const search = fieldSearch.toLowerCase();
      fields = fields.filter((f) => f.path.toLowerCase().includes(search));
    }

    // Show arrays only filter
    if (showArraysOnly) {
      fields = fields.filter((f) => f.isArray);
    }

    // Filter out objects (they're just containers)
    fields = fields.filter((f) => !f.isObject);

    return fields;
  }, [availableFields, selectedFields, fieldSearch, showArraysOnly]);

  // Count top-level fields
  const topLevelFieldCount = useMemo(() => {
    if (!apiResponse) return 0;
    return Object.keys(apiResponse).length;
  }, [apiResponse]);

  // Test API endpoint
  const handleTestApi = async () => {
    if (!formData.apiUrl) {
      setApiError("Please enter an API URL first");
      return;
    }

    setIsTestingApi(true);
    setApiError(null);
    setApiResponse(null);
    setApiSuccess(false);
    setSelectedFields([]);

    try {
      const response = await fetch(formData.apiUrl);
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

  // Add a field to selected
  const handleAddField = (field) => {
    const pathParts = field.path.split(".");
    const label = pathParts[pathParts.length - 1]
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    setSelectedFields((prev) => [
      ...prev,
      {
        key: field.path,
        label: label,
        format: inferFormat(field.path, field.value),
      },
    ]);
  };

  // Remove a field from selected
  const handleRemoveField = (path) => {
    setSelectedFields((prev) => prev.filter((f) => f.key !== path));
  };

  // Update field label
  const handleUpdateFieldLabel = (path, newLabel) => {
    setSelectedFields((prev) =>
      prev.map((f) => (f.key === path ? { ...f, label: newLabel } : f))
    );
  };

  // Update field format
  const handleUpdateFieldFormat = (path, newFormat) => {
    setSelectedFields((prev) =>
      prev.map((f) => (f.key === path ? { ...f, format: newFormat } : f))
    );
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    // Reset API test when URL changes
    if (name === "apiUrl") {
      setApiResponse(null);
      setApiSuccess(false);
      setApiError(null);
      setSelectedFields([]);
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Widget name is required";
    }
    if (!formData.apiUrl.trim()) {
      newErrors.apiUrl = "API URL is required";
    }
    if (formData.refreshIntervalSec < 0) {
      newErrors.refreshIntervalSec = "Refresh interval cannot be negative";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Create widget object
    const newWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      type: formData.type,
      symbol: "CUSTOM",
      apiUrl: formData.apiUrl.trim(),
      apiSource: "custom",
      refreshIntervalSec: formData.refreshIntervalSec,
      dataPath: formData.dataPath || null,
      fields: selectedFields,
      displayMode: formData.type,
      position: { x: 0, y: 0 },
      size: getDefaultSize(formData.type),
    };

    onAdd(newWidget);
    resetForm();
    onClose();
  };

  // Get default size based on widget type
  const getDefaultSize = (type) => {
    switch (type) {
      case "card":
        return { w: 1, h: 1 };
      case "table":
        return { w: 2, h: 1 };
      case "chart":
        return { w: 2, h: 2 };
      default:
        return { w: 1, h: 1 };
    }
  };

  // Reset form to defaults
  const resetForm = () => {
    setFormData({
      name: "",
      type: "card",
      apiUrl: "",
      refreshIntervalSec: 60,
      dataPath: "",
    });
    setErrors({});
    setApiResponse(null);
    setApiError(null);
    setApiSuccess(false);
    setSelectedFields([]);
    setFieldSearch("");
    setShowArraysOnly(false);
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-emerald-400"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                Add New Widget
              </h2>
              <p className="text-xs text-zinc-500">
                Connect to an API and select fields to display
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          {/* Widget Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Widget Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Bitcoin Price"
              className={`
                w-full px-4 py-2.5 rounded-xl
                bg-zinc-800 border 
                ${errors.name ? "border-red-500" : "border-zinc-700"}
                text-zinc-100 placeholder-zinc-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                transition-colors
              `}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* API URL with Test Button */}
          <div>
            <label
              htmlFor="apiUrl"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              API URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                id="apiUrl"
                name="apiUrl"
                value={formData.apiUrl}
                onChange={handleChange}
                placeholder="https://api.example.com/data"
                className={`
                  flex-1 px-4 py-2.5 rounded-xl
                  bg-zinc-800 border 
                  ${errors.apiUrl ? "border-red-500" : "border-zinc-700"}
                  text-zinc-100 placeholder-zinc-500
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                  transition-colors
                `}
              />
              <button
                type="button"
                onClick={handleTestApi}
                disabled={!formData.apiUrl || isTestingApi}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-medium transition-colors flex items-center gap-2 shrink-0"
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
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                    Test
                  </>
                )}
              </button>
            </div>
            {errors.apiUrl && (
              <p className="mt-1 text-xs text-red-400">{errors.apiUrl}</p>
            )}
          </div>

          {/* API Test Result */}
          {apiSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-emerald-400"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span className="text-sm text-emerald-400">
                API connection successful! {topLevelFieldCount} top-level fields
                found.
              </span>
            </div>
          )}

          {apiError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-red-400"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span className="text-sm text-red-400">{apiError}</span>
            </div>
          )}

          {/* Refresh Interval */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              name="refreshIntervalSec"
              value={formData.refreshIntervalSec}
              onChange={handleChange}
              min="0"
              max="3600"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          {/* Fields Selection - Only show after successful API test */}
          {apiSuccess && (
            <>
              <div className="pt-2 border-t border-zinc-800">
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Select Fields to Display
                </label>

                {/* Display Mode */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Display Mode
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "card", label: "Card", icon: "◫" },
                      { value: "table", label: "Table", icon: "▦" },
                      { value: "chart", label: "Chart", icon: "📈" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            type: option.value,
                          }))
                        }
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${
                            formData.type === option.value
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                          }
                        `}
                      >
                        <span>{option.icon}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Path (optional) */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Data Path (optional - for nested data)
                  </label>
                  <input
                    type="text"
                    name="dataPath"
                    value={formData.dataPath}
                    onChange={handleChange}
                    placeholder="e.g., data.items or leave empty for root"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Search Fields */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Search Fields
                  </label>
                  <input
                    type="text"
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    placeholder="Search for fields..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Show arrays only checkbox */}
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArraysOnly}
                    onChange={(e) => setShowArraysOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  <span className="text-sm text-zinc-400">
                    Show arrays only (for table view)
                  </span>
                </label>

                {/* Available Fields */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Available Fields
                  </label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800/50">
                    {filteredFields.length > 0 ? (
                      filteredFields.slice(0, 50).map((field) => (
                        <div
                          key={field.path}
                          className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/50 last:border-b-0 hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-zinc-200 font-mono truncate">
                              {field.path}
                            </div>
                            <div className="text-xs text-zinc-500 truncate">
                              {field.type} | {field.value}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddField(field)}
                            className="ml-2 p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0"
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
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-zinc-500">
                        {fieldSearch
                          ? "No fields match your search"
                          : "No fields available"}
                      </div>
                    )}
                    {filteredFields.length > 50 && (
                      <div className="px-3 py-2 text-center text-xs text-zinc-500 bg-zinc-800">
                        Showing first 50 of {filteredFields.length} fields. Use
                        search to filter.
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Fields */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Selected Fields ({selectedFields.length})
                  </label>
                  <div className="space-y-2">
                    {selectedFields.length > 0 ? (
                      selectedFields.map((field) => (
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
                                handleUpdateFieldLabel(
                                  field.key,
                                  e.target.value
                                )
                              }
                              className="w-full mt-1 px-2 py-1 rounded bg-zinc-700 border border-zinc-600 text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                              placeholder="Display label"
                            />
                          </div>
                          <select
                            value={field.format}
                            onChange={(e) =>
                              handleUpdateFieldFormat(field.key, e.target.value)
                            }
                            className="px-2 py-1 rounded bg-zinc-700 border border-zinc-600 text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="currency">Currency</option>
                            <option value="percent">Percent</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(field.key)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
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
                        No fields selected. Click + on available fields to add
                        them.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-900 shadow-lg shadow-emerald-500/25 transition-all"
            >
              Add Widget
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
