/**
 * JSON Path Utilities
 * Functions for navigating and extracting data from nested JSON objects
 */

/**
 * Get a value from a nested object using a dot-notation path
 * @param {Object} obj - The object to traverse
 * @param {string|null} path - Dot-notation path (e.g., "data.items.0.name")
 * @returns {*} The value at the path, or undefined if not found
 *
 * @example
 * getByPath({ data: { items: [{ name: 'test' }] } }, 'data.items.0.name')
 * // Returns: 'test'
 */
export function getByPath(obj, path) {
  // If path is null, empty, or undefined, return the original object
  if (!path || path === "") {
    return obj;
  }

  // Handle edge cases
  if (obj === null || obj === undefined) {
    return undefined;
  }

  // Split path by dots and traverse
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array index access (numeric keys)
    if (Array.isArray(current) && /^\d+$/.test(key)) {
      current = current[parseInt(key, 10)];
    } else if (typeof current === "object") {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set a value in a nested object using a dot-notation path
 * Creates intermediate objects/arrays as needed
 * @param {Object} obj - The object to modify
 * @param {string} path - Dot-notation path
 * @param {*} value - The value to set
 * @returns {Object} A new object with the value set (immutable)
 */
export function setByPath(obj, path, value) {
  if (!path) return value;

  const keys = path.split(".");
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isNextKeyNumeric = /^\d+$/.test(nextKey);

    if (current[key] === undefined || current[key] === null) {
      current[key] = isNextKeyNumeric ? [] : {};
    } else {
      current[key] = Array.isArray(current[key])
        ? [...current[key]]
        : { ...current[key] };
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

/**
 * Check if a path exists in an object
 * @param {Object} obj - The object to check
 * @param {string} path - Dot-notation path
 * @returns {boolean} Whether the path exists
 */
export function hasPath(obj, path) {
  return getByPath(obj, path) !== undefined;
}

/**
 * Get all paths in an object (for JSON explorer)
 * @param {Object} obj - The object to analyze
 * @param {string} prefix - Current path prefix
 * @param {number} maxDepth - Maximum depth to traverse
 * @returns {Array<{path: string, type: string, value: *, isArray: boolean}>}
 */
export function getAllPaths(obj, prefix = "", maxDepth = 5) {
  const paths = [];

  if (maxDepth <= 0 || obj === null || obj === undefined) {
    return paths;
  }

  const isArray = Array.isArray(obj);
  const type = isArray ? "array" : typeof obj;

  // Add current path
  if (prefix) {
    paths.push({
      path: prefix,
      type,
      value: obj,
      isArray,
      isObject: type === "object",
      childCount: isArray ? obj.length : Object.keys(obj).length,
    });
  }

  // Traverse nested objects/arrays
  if (type === "object" || isArray) {
    const keys = isArray
      ? obj.slice(0, 3).map((_, i) => String(i)) // Limit array preview to first 3
      : Object.keys(obj);

    for (const key of keys) {
      const childPath = prefix ? `${prefix}.${key}` : key;
      const childValue = obj[key];
      const childType = Array.isArray(childValue) ? "array" : typeof childValue;

      if (childType === "object" || childType === "array") {
        paths.push(...getAllPaths(childValue, childPath, maxDepth - 1));
      } else {
        paths.push({
          path: childPath,
          type: childType,
          value: childValue,
          isArray: false,
          isObject: false,
          childCount: 0,
        });
      }
    }
  }

  return paths;
}

/**
 * Get keys from the first item in an array (for field selection)
 * @param {Array} arr - The array to analyze
 * @returns {Array<{key: string, type: string, sample: *}>}
 */
export function getArrayItemKeys(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return [];
  }

  const firstItem = arr[0];

  // Handle array of primitives
  if (typeof firstItem !== "object" || firstItem === null) {
    return [{ key: "value", type: typeof firstItem, sample: firstItem }];
  }

  // Handle array of arrays (e.g., [[timestamp, price], ...])
  if (Array.isArray(firstItem)) {
    return firstItem.map((_, index) => ({
      key: String(index),
      type: typeof firstItem[index],
      sample: firstItem[index],
    }));
  }

  // Handle array of objects
  return Object.entries(firstItem).map(([key, value]) => ({
    key,
    type: Array.isArray(value) ? "array" : typeof value,
    sample: value,
  }));
}

/**
 * Format a value based on its format type
 * @param {*} value - The value to format
 * @param {string} format - Format type: 'string', 'number', 'currency', 'percent'
 * @returns {string} Formatted value
 */
export function formatValue(value, format = "string") {
  if (value === null || value === undefined) {
    return "—";
  }

  switch (format) {
    case "currency":
      const num = typeof value === "number" ? value : parseFloat(value);
      if (isNaN(num)) return String(value);
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: num < 1 ? 4 : 2,
        maximumFractionDigits: num < 1 ? 6 : 2,
      }).format(num);

    case "percent":
      const pct = typeof value === "number" ? value : parseFloat(value);
      if (isNaN(pct)) return String(value);
      return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

    case "number":
      const n = typeof value === "number" ? value : parseFloat(value);
      if (isNaN(n)) return String(value);
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
        notation: n > 1000000 ? "compact" : "standard",
      }).format(n);

    case "string":
    default:
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return String(value);
  }
}

/**
 * Infer the format type from a value
 * @param {*} value - The value to analyze
 * @param {string} key - The key name (for hints)
 * @returns {string} Inferred format type
 */
export function inferFormat(value, key = "") {
  const keyLower = key.toLowerCase();

  // Check key name hints
  if (
    keyLower.includes("price") ||
    keyLower.includes("cost") ||
    keyLower.includes("cap")
  ) {
    return "currency";
  }
  if (
    keyLower.includes("percent") ||
    keyLower.includes("change") ||
    keyLower.includes("pct")
  ) {
    return "percent";
  }

  // Check value type
  if (typeof value === "number") {
    return "number";
  }

  return "string";
}
