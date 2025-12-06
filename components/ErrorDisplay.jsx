"use client";

import { useState, useEffect } from "react";
import { getErrorStyle, formatRetryTime, ErrorType } from "@/lib/errorUtils";

/**
 * ErrorDisplay Component
 * Shows user-friendly error messages with appropriate styling
 * Supports countdown timer for rate limits
 */
export default function ErrorDisplay({ error, onRetry, compact = false }) {
  const [countdown, setCountdown] = useState(null);

  // Extract error info
  const errorType = error?.type || ErrorType.UNKNOWN;
  const message = error?.message || "Something went wrong";
  const detail =
    error?.detail || error?.message || "An unexpected error occurred";
  const retryAfter = error?.retryAfter;

  // Get styling for this error type
  const style = getErrorStyle(errorType);

  // Countdown timer for rate limits
  useEffect(() => {
    if (errorType === ErrorType.RATE_LIMIT && retryAfter) {
      setCountdown(retryAfter);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [errorType, retryAfter]);

  // Compact version for small widgets
  if (compact) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-4 text-center`}
      >
        <div
          className={`w-10 h-10 rounded-xl ${style.bgColor} flex items-center justify-center mb-2`}
        >
          <span className="text-xl">{style.icon}</span>
        </div>
        <p className={`text-xs ${style.textColor} font-medium mb-1`}>
          {message}
        </p>
        {countdown > 0 ? (
          <p className="text-xs text-zinc-500">
            Retry in {formatRetryTime(countdown)}
          </p>
        ) : (
          onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-3 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Retry
            </button>
          )
        )}
      </div>
    );
  }

  // Full version with details
  return (
    <div
      className={`flex flex-col items-center justify-center py-6 text-center`}
    >
      <div
        className={`w-12 h-12 rounded-xl ${style.bgColor} flex items-center justify-center mb-3`}
      >
        <span className="text-2xl">{style.icon}</span>
      </div>

      <h3 className={`text-sm font-semibold ${style.textColor} mb-1`}>
        {message}
      </h3>

      <p className="text-xs text-zinc-500 max-w-[250px] mb-3">{detail}</p>

      {/* Rate limit countdown */}
      {errorType === ErrorType.RATE_LIMIT && countdown > 0 && (
        <div
          className={`px-3 py-2 rounded-lg ${style.bgColor} ${style.borderColor} border mb-3`}
        >
          <p className="text-xs text-zinc-400">
            <span className={style.textColor}>⏱️</span> Retry available in{" "}
            <span className={`font-mono ${style.textColor}`}>
              {formatRetryTime(countdown)}
            </span>
          </p>
        </div>
      )}

      {/* Suggestions based on error type */}
      {errorType === ErrorType.AUTH_ERROR && (
        <p className="text-xs text-zinc-500 mb-3">
          💡 Check your API key in the widget settings
        </p>
      )}

      {errorType === ErrorType.NETWORK_ERROR && (
        <p className="text-xs text-zinc-500 mb-3">
          💡 Check your internet connection
        </p>
      )}

      {/* Retry button */}
      {onRetry && (countdown === 0 || countdown === null) && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Inline error badge for widget headers
 */
export function ErrorBadge({ error }) {
  const errorType = error?.type || ErrorType.UNKNOWN;
  const style = getErrorStyle(errorType);
  const message = error?.message || "Error";

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${style.bgColor} ${style.textColor}`}
      title={error?.detail || message}
    >
      <span>{style.icon}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
}
