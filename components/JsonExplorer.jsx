"use client";

import { useState, useMemo } from "react";
import { getArrayItemKeys } from "@/lib/jsonPath";

/**
 * JsonExplorer Component
 * Displays a collapsible tree view of JSON data
 * Allows selecting paths for data mapping
 */
export default function JsonExplorer({
  data,
  onSelectPath,
  selectedPath,
  onSelectFields,
  maxDepth = 6,
}) {
  if (!data) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        No data to explore
      </div>
    );
  }

  return (
    <div className="font-mono text-sm">
      <JsonNode
        data={data}
        path=""
        depth={0}
        maxDepth={maxDepth}
        onSelectPath={onSelectPath}
        selectedPath={selectedPath}
        onSelectFields={onSelectFields}
      />
    </div>
  );
}

/**
 * Recursive JSON node component
 */
function JsonNode({
  data,
  path,
  keyName,
  depth,
  maxDepth,
  onSelectPath,
  selectedPath,
  onSelectFields,
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const dataType = useMemo(() => {
    if (data === null) return "null";
    if (Array.isArray(data)) return "array";
    return typeof data;
  }, [data]);

  const isExpandable = dataType === "object" || dataType === "array";
  const isSelected = path === selectedPath;
  const isArrayOfObjects =
    dataType === "array" &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null;

  // Get preview of array/object
  const preview = useMemo(() => {
    if (dataType === "array") {
      return `Array(${data.length})`;
    }
    if (dataType === "object") {
      const keys = Object.keys(data);
      return `{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "..." : ""}}`;
    }
    return null;
  }, [data, dataType]);

  const handleClick = () => {
    if (isExpandable) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelectPath?.(path);
  };

  // Don't render beyond max depth
  if (depth > maxDepth) {
    return <span className="text-zinc-500">...</span>;
  }

  // Render primitive values
  if (!isExpandable) {
    return (
      <span
        className={`
          ${dataType === "string" ? "text-emerald-400" : ""}
          ${dataType === "number" ? "text-amber-400" : ""}
          ${dataType === "boolean" ? "text-blue-400" : ""}
          ${dataType === "null" ? "text-zinc-500 italic" : ""}
        `}
      >
        {dataType === "string"
          ? `"${String(data).slice(0, 50)}${
              String(data).length > 50 ? "..." : ""
            }"`
          : String(data)}
      </span>
    );
  }

  // Render expandable nodes
  return (
    <div className="select-none">
      {/* Node header */}
      <div
        className={`
          flex items-center gap-2 py-0.5 px-1 -mx-1 rounded cursor-pointer
          hover:bg-zinc-800/50
          ${isSelected ? "bg-emerald-500/20 ring-1 ring-emerald-500/50" : ""}
        `}
        onClick={handleClick}
      >
        {/* Expand/collapse icon */}
        <span
          className={`
            w-4 h-4 flex items-center justify-center text-zinc-500
            transition-transform duration-150
            ${isExpanded ? "rotate-90" : ""}
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>

        {/* Key name */}
        {keyName !== undefined && (
          <>
            <span className="text-purple-400">{keyName}</span>
            <span className="text-zinc-500">:</span>
          </>
        )}

        {/* Type badge */}
        <span
          className={`
            text-xs px-1.5 py-0.5 rounded
            ${
              dataType === "array"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-zinc-700 text-zinc-400"
            }
          `}
        >
          {preview}
        </span>

        {/* Select button for arrays */}
        {path && (
          <button
            onClick={handleSelect}
            className={`
              ml-auto px-2 py-0.5 text-xs rounded transition-colors
              ${
                isSelected
                  ? "bg-emerald-500 text-zinc-900"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }
            `}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="ml-4 pl-3 border-l border-zinc-800">
          {dataType === "array" ? (
            // Array items
            <>
              {data.slice(0, 5).map((item, index) => (
                <div key={index} className="py-0.5">
                  <JsonNode
                    data={item}
                    path={path ? `${path}.${index}` : String(index)}
                    keyName={index}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                    onSelectPath={onSelectPath}
                    selectedPath={selectedPath}
                    onSelectFields={onSelectFields}
                  />
                </div>
              ))}
              {data.length > 5 && (
                <div className="text-zinc-500 text-xs py-1">
                  ... and {data.length - 5} more items
                </div>
              )}
            </>
          ) : (
            // Object properties
            Object.entries(data).map(([key, value]) => (
              <div key={key} className="py-0.5">
                <JsonNode
                  data={value}
                  path={path ? `${path}.${key}` : key}
                  keyName={key}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  onSelectPath={onSelectPath}
                  selectedPath={selectedPath}
                  onSelectFields={onSelectFields}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Field selector for selected array path */}
      {isSelected && isArrayOfObjects && onSelectFields && (
        <FieldSelector data={data} onSelectFields={onSelectFields} />
      )}
    </div>
  );
}

/**
 * Field selector for array items
 */
function FieldSelector({ data, onSelectFields }) {
  const [selectedKeys, setSelectedKeys] = useState([]);
  const availableKeys = useMemo(() => getArrayItemKeys(data), [data]);

  const toggleKey = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleApply = () => {
    const fields = selectedKeys.map((key) => {
      const keyInfo = availableKeys.find((k) => k.key === key);
      return {
        key,
        label: formatKeyLabel(key),
        format: inferFieldFormat(key, keyInfo?.sample),
      };
    });
    onSelectFields(fields);
  };

  return (
    <div className="mt-2 ml-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
      <div className="text-xs text-zinc-400 mb-2">
        Select fields to display:
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {availableKeys.map(({ key, type, sample }) => (
          <button
            key={key}
            onClick={() => toggleKey(key)}
            className={`
              px-2 py-1 text-xs rounded-lg border transition-colors
              ${
                selectedKeys.includes(key)
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }
            `}
          >
            <span className="font-medium">{key}</span>
            <span className="text-zinc-500 ml-1">({type})</span>
          </button>
        ))}
      </div>
      {selectedKeys.length > 0 && (
        <button
          onClick={handleApply}
          className="px-3 py-1.5 text-xs font-medium bg-emerald-500 text-zinc-900 rounded-lg hover:bg-emerald-400 transition-colors"
        >
          Apply {selectedKeys.length} fields
        </button>
      )}
    </div>
  );
}

/**
 * Format a key name into a readable label
 */
function formatKeyLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Infer field format from key name and sample value
 */
function inferFieldFormat(key, sample) {
  const keyLower = key.toLowerCase();

  if (
    keyLower.includes("price") ||
    keyLower.includes("cost") ||
    keyLower.includes("cap") ||
    keyLower.includes("value")
  ) {
    return "currency";
  }
  if (
    keyLower.includes("percent") ||
    keyLower.includes("change") ||
    keyLower.includes("pct") ||
    keyLower.includes("ratio")
  ) {
    return "percent";
  }
  if (typeof sample === "number") {
    return "number";
  }
  return "string";
}
