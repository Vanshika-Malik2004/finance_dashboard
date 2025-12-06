/**
 * Error Utilities
 * Parses API errors and returns user-friendly messages
 */

/**
 * Error types for different styling/handling
 */
export const ErrorType = {
  RATE_LIMIT: "rate_limit",
  AUTH_ERROR: "auth_error",
  NOT_FOUND: "not_found",
  SERVER_ERROR: "server_error",
  NETWORK_ERROR: "network_error",
  TIMEOUT: "timeout",
  INVALID_DATA: "invalid_data",
  UNKNOWN: "unknown",
};

/**
 * Parse an API response and detect if it contains an error
 * Some APIs (like Alpha Vantage) return 200 with error in body
 *
 * @param {Object} json - The JSON response
 * @returns {Object|null} Error object if error detected, null otherwise
 */
export function detectApiResponseError(json) {
  if (!json || typeof json !== "object") return null;

  // Alpha Vantage rate limit - returns 200 with "Note" field
  if (json.Note && json.Note.includes("API call frequency")) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: "API rate limit reached",
      detail:
        "Alpha Vantage allows 25 requests/day (free tier). Try again tomorrow or upgrade your API key.",
      retryAfter: 60 * 60, // 1 hour in seconds
    };
  }

  // Alpha Vantage - returns "Information" for invalid calls
  if (json.Information) {
    return {
      type: ErrorType.INVALID_DATA,
      message: "Invalid API request",
      detail: json.Information,
    };
  }

  // Alpha Vantage - returns "Error Message" for bad symbols
  if (json["Error Message"]) {
    return {
      type: ErrorType.INVALID_DATA,
      message: "Invalid request",
      detail: json["Error Message"],
    };
  }

  // CoinGecko rate limit
  if (json.status?.error_code === 429) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: "API rate limit reached",
      detail: "Too many requests. Please wait before trying again.",
      retryAfter: 60,
    };
  }

  return null;
}

/**
 * Parse an HTTP error and return a user-friendly message
 *
 * @param {number} status - HTTP status code
 * @param {string} statusText - HTTP status text
 * @param {string} responseBody - Response body text
 * @returns {Object} Parsed error object
 */
export function parseHttpError(status, statusText, responseBody = "") {
  // Try to parse response body as JSON
  let bodyJson = null;
  try {
    bodyJson = JSON.parse(responseBody);
  } catch (e) {
    // Not JSON, that's fine
  }

  // Check for API-specific errors in response body
  if (bodyJson) {
    const apiError = detectApiResponseError(bodyJson);
    if (apiError) return apiError;
  }

  // Parse by HTTP status code
  switch (status) {
    case 400:
      return {
        type: ErrorType.INVALID_DATA,
        message: "Bad request",
        detail:
          "The API couldn't understand the request. Check the URL and parameters.",
      };

    case 401:
      return {
        type: ErrorType.AUTH_ERROR,
        message: "Authentication required",
        detail: "API key is missing or invalid. Please check your API key.",
      };

    case 403:
      return {
        type: ErrorType.AUTH_ERROR,
        message: "Access denied",
        detail: "Your API key doesn't have permission for this resource.",
      };

    case 404:
      return {
        type: ErrorType.NOT_FOUND,
        message: "Not found",
        detail: "The requested resource doesn't exist. Check the API URL.",
      };

    case 429:
      return {
        type: ErrorType.RATE_LIMIT,
        message: "Rate limit exceeded",
        detail: "Too many requests. Please wait before trying again.",
        retryAfter: extractRetryAfter(responseBody) || 60,
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: ErrorType.SERVER_ERROR,
        message: "Server error",
        detail: "The API server is having issues. Try again later.",
      };

    default:
      return {
        type: ErrorType.UNKNOWN,
        message: `Error (${status})`,
        detail:
          statusText ||
          responseBody?.slice(0, 100) ||
          "An unexpected error occurred.",
      };
  }
}

/**
 * Parse a network/fetch error
 *
 * @param {Error} error - The error object
 * @returns {Object} Parsed error object
 */
export function parseNetworkError(error) {
  const message = error.message?.toLowerCase() || "";

  if (message.includes("timeout") || message.includes("timed out")) {
    return {
      type: ErrorType.TIMEOUT,
      message: "Request timed out",
      detail:
        "The API took too long to respond. Check your connection or try again.",
    };
  }

  if (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("net::err")
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: "Network error",
      detail: "Couldn't connect to the API. Check your internet connection.",
    };
  }

  if (message.includes("cors")) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: "CORS error",
      detail:
        "The API doesn't allow requests from this origin. Try a different API or use a proxy.",
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: "Request failed",
    detail: error.message || "An unexpected error occurred.",
  };
}

/**
 * Extract retry-after value from response
 *
 * @param {string} responseBody - Response body
 * @returns {number|null} Retry after in seconds
 */
function extractRetryAfter(responseBody) {
  // Try to find retry-after in response
  const match = responseBody?.match(/retry.{0,10}?(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Get icon and color for error type
 *
 * @param {string} errorType - Error type from ErrorType enum
 * @returns {Object} { icon, bgColor, textColor }
 */
export function getErrorStyle(errorType) {
  switch (errorType) {
    case ErrorType.RATE_LIMIT:
      return {
        icon: "⏱️",
        bgColor: "bg-amber-500/20",
        textColor: "text-amber-400",
        borderColor: "border-amber-500/30",
      };

    case ErrorType.AUTH_ERROR:
      return {
        icon: "🔑",
        bgColor: "bg-orange-500/20",
        textColor: "text-orange-400",
        borderColor: "border-orange-500/30",
      };

    case ErrorType.NOT_FOUND:
      return {
        icon: "🔍",
        bgColor: "bg-zinc-500/20",
        textColor: "text-zinc-400",
        borderColor: "border-zinc-500/30",
      };

    case ErrorType.NETWORK_ERROR:
      return {
        icon: "📡",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-400",
        borderColor: "border-blue-500/30",
      };

    case ErrorType.TIMEOUT:
      return {
        icon: "⏳",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-400",
        borderColor: "border-purple-500/30",
      };

    case ErrorType.SERVER_ERROR:
      return {
        icon: "🔧",
        bgColor: "bg-red-500/20",
        textColor: "text-red-400",
        borderColor: "border-red-500/30",
      };

    default:
      return {
        icon: "⚠️",
        bgColor: "bg-red-500/20",
        textColor: "text-red-400",
        borderColor: "border-red-500/30",
      };
  }
}

/**
 * Format retry time for display
 *
 * @param {number} seconds - Seconds until retry
 * @returns {string} Formatted time string
 */
export function formatRetryTime(seconds) {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  if (seconds < 3600) {
    const mins = Math.ceil(seconds / 60);
    return `${mins} minute${mins > 1 ? "s" : ""}`;
  }
  const hours = Math.ceil(seconds / 3600);
  return `${hours} hour${hours > 1 ? "s" : ""}`;
}
