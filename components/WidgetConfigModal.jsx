"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import JsonExplorer from "./JsonExplorer";
import useDashboardStore from "@/store/dashboardStore";
import { inferFormat } from "@/lib/jsonPath";

/**
 * WidgetConfigModal Component
 * Modal for configuring widget data source and field mappings
 * Uses React Portal to render at document body level to avoid z-index issues
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

  // Handle client-side mounting for portal
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
    }
  }, [widget, isOpen]);

  // Test API endpoint
  const handleTestApi = async () => {
    if (!apiUrl) return;

    setIsTestingApi(true);
    setApiError(null);
    setApiResponse(null);

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const json = await response.json();
      setApiResponse(json);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsTestingApi(false);
    }
  };

  // Handle path selection from JSON explorer
  const handleSelectPath = useCallback((path) => {
    setDataPath(path);
  }, []);

  // Handle field selection from JSON explorer
  const handleSelectFields = useCallback((selectedFields) => {
    setFields(selectedFields);
  }, []);

  // Add a field manually
  const addField = () => {
    setFields([...fields, { key: "", label: "", format: "string" }]);
  };

  // Update a field
  const updateField = (index, updates) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  // Remove a field
  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
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

  // Don't render until mounted (for SSR compatibility) or if not open
  if (!mounted || !isOpen || !widget) return null;

  // Use portal to render modal at document body level
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
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
                Set up data source and field mappings
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                onChange={(e) => setApiUrl(e.target.value)}
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
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {apiError}
              </p>
            )}
          </div>

          {/* JSON Explorer */}
          {apiResponse && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-300">
                  API Response Explorer
                </label>
                {dataPath && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                    Path: {dataPath}
                  </span>
                )}
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 max-h-[300px] overflow-auto">
                <JsonExplorer
                  data={apiResponse}
                  onSelectPath={handleSelectPath}
                  selectedPath={dataPath}
                  onSelectFields={handleSelectFields}
                />
              </div>
            </div>
          )}

          {/* Data Path (manual input) */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Data Path{" "}
              <span className="text-zinc-500 font-normal">
                (dot notation, e.g., "data.items")
              </span>
            </label>
            <input
              type="text"
              value={dataPath}
              onChange={(e) => setDataPath(e.target.value)}
              placeholder="Leave empty if data is at root level"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* Field Mappings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-300">
                Field Mappings
              </label>
              <button
                onClick={addField}
                className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 transition-colors"
              >
                + Add Field
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl"
                >
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) =>
                      updateField(index, { key: e.target.value })
                    }
                    placeholder="Key (e.g., price)"
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      updateField(index, { label: e.target.value })
                    }
                    placeholder="Label"
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={field.format}
                    onChange={(e) =>
                      updateField(index, { format: e.target.value })
                    }
                    className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="currency">Currency</option>
                    <option value="percent">Percent</option>
                  </select>
                  <button
                    onClick={() => removeField(index)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
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
              ))}
              {fields.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No fields configured. Add fields manually or select from the
                  JSON explorer.
                </p>
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
