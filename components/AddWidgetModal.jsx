"use client";

import { useState } from "react";

/**
 * AddWidgetModal Component
 * Modal form for creating new dashboard widgets
 * Supports card, table, and chart widget types
 */
export default function AddWidgetModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "card",
    symbol: "",
    apiUrl: "",
    refreshIntervalSec: 60,
  });

  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Widget name is required";
    }
    if (!formData.symbol.trim()) {
      newErrors.symbol = "Stock symbol is required";
    }
    if (formData.refreshIntervalSec < 10) {
      newErrors.refreshIntervalSec = "Minimum refresh interval is 10 seconds";
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
      symbol: formData.symbol.toUpperCase().trim(),
      apiUrl:
        formData.apiUrl.trim() ||
        `https://api.example.com/stock/${formData.symbol.toUpperCase()}`,
      apiSource: "alphavantage",
      refreshIntervalSec: formData.refreshIntervalSec,
      selectedFields: getDefaultFields(formData.type),
      position: { x: 0, y: 0 },
      size: getDefaultSize(formData.type),
    };

    onAdd(newWidget);
    resetForm();
    onClose();
  };

  // Get default fields based on widget type
  const getDefaultFields = (type) => {
    switch (type) {
      case "card":
        return ["price", "change", "changePercent"];
      case "table":
        return ["symbol", "price", "volume", "high", "low"];
      case "chart":
        return ["timestamp", "close", "volume"];
      default:
        return [];
    }
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
      symbol: "",
      apiUrl: "",
      refreshIntervalSec: 60,
    });
    setErrors({});
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
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
                Configure your dashboard widget
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Widget Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Widget Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Apple Stock Price"
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

          {/* Widget Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Widget Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  value: "card",
                  label: "Card",
                  desc: "Single metric",
                  color: "emerald",
                },
                {
                  value: "table",
                  label: "Table",
                  desc: "Data grid",
                  color: "blue",
                },
                {
                  value: "chart",
                  label: "Chart",
                  desc: "Visualization",
                  color: "amber",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: option.value }))
                  }
                  className={`
                    p-3 rounded-xl border-2 text-left transition-all
                    ${
                      formData.type === option.value
                        ? `border-${option.color}-500 bg-${option.color}-500/10`
                        : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/50"
                    }
                  `}
                >
                  <div
                    className={`
                    w-8 h-8 rounded-lg mb-2 flex items-center justify-center
                    ${
                      formData.type === option.value
                        ? `bg-${option.color}-500/20`
                        : "bg-zinc-700"
                    }
                  `}
                  >
                    {option.value === "card" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={
                          formData.type === option.value
                            ? "text-emerald-400"
                            : "text-zinc-400"
                        }
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                    )}
                    {option.value === "table" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={
                          formData.type === option.value
                            ? "text-blue-400"
                            : "text-zinc-400"
                        }
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M3 15h18M9 3v18" />
                      </svg>
                    )}
                    {option.value === "chart" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={
                          formData.type === option.value
                            ? "text-amber-400"
                            : "text-zinc-400"
                        }
                      >
                        <path d="M3 3v18h18" />
                        <path d="M18 17V9M13 17V5M8 17v-3" />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm font-medium text-zinc-200">
                    {option.label}
                  </div>
                  <div className="text-xs text-zinc-500">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stock Symbol */}
          <div>
            <label
              htmlFor="symbol"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Stock Symbol <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              placeholder="e.g., AAPL, GOOGL, MSFT"
              className={`
                w-full px-4 py-2.5 rounded-xl uppercase
                bg-zinc-800 border
                ${errors.symbol ? "border-red-500" : "border-zinc-700"}
                text-zinc-100 placeholder-zinc-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                transition-colors
              `}
            />
            {errors.symbol && (
              <p className="mt-1 text-xs text-red-400">{errors.symbol}</p>
            )}
          </div>

          {/* API URL (Optional) */}
          <div>
            <label
              htmlFor="apiUrl"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              API URL{" "}
              <span className="text-zinc-500 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              id="apiUrl"
              name="apiUrl"
              value={formData.apiUrl}
              onChange={handleChange}
              placeholder="https://api.example.com/stock/AAPL"
              className="
                w-full px-4 py-2.5 rounded-xl
                bg-zinc-800 border border-zinc-700
                text-zinc-100 placeholder-zinc-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                transition-colors
              "
            />
            <p className="mt-1 text-xs text-zinc-500">
              Leave empty to use default API endpoint
            </p>
          </div>

          {/* Refresh Interval */}
          <div>
            <label
              htmlFor="refreshIntervalSec"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Refresh Interval (seconds)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="refreshIntervalSec"
                name="refreshIntervalSec"
                value={formData.refreshIntervalSec}
                onChange={handleChange}
                min="10"
                max="3600"
                className={`
                  w-32 px-4 py-2.5 rounded-xl
                  bg-zinc-800 border
                  ${
                    errors.refreshIntervalSec
                      ? "border-red-500"
                      : "border-zinc-700"
                  }
                  text-zinc-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                  transition-colors
                `}
              />
              <div className="flex gap-2">
                {[30, 60, 120, 300].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        refreshIntervalSec: val,
                      }))
                    }
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${
                        formData.refreshIntervalSec === val
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                      }
                    `}
                  >
                    {val < 60 ? `${val}s` : `${val / 60}m`}
                  </button>
                ))}
              </div>
            </div>
            {errors.refreshIntervalSec && (
              <p className="mt-1 text-xs text-red-400">
                {errors.refreshIntervalSec}
              </p>
            )}
          </div>

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
              className="
                px-5 py-2.5 rounded-xl text-sm font-semibold
                bg-emerald-500 hover:bg-emerald-400
                text-zinc-900
                shadow-lg shadow-emerald-500/25
                transition-all duration-200
                hover:shadow-emerald-500/40
              "
            >
              Add Widget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
