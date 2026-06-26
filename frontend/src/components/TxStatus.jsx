import React from "react";
import { txUrl } from "../config";

// Visual feedback for a transaction: pending / success (with Etherscan link) / error.
export default function TxStatus({ status, txHash, message, onDismiss }) {
  if (status === "idle") return null;

  const styles = {
    pending: "bg-amber-50 border-amber-300 text-amber-800",
    success: "bg-green-50 border-green-300 text-green-800",
    error: "bg-red-50 border-red-300 text-red-800",
  }[status];

  return (
    <div
      className={`mt-3 rounded-lg border px-3 py-2 text-sm flex items-start gap-2 ${styles}`}
      role="status"
    >
      <span className="mt-0.5">
        {status === "pending" && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
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
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {status === "success" && <span>✅</span>}
        {status === "error" && <span>⚠️</span>}
      </span>
      <div className="flex-1 break-words">
        <div className="font-medium">
          {status === "pending" && "Transaction pending…"}
          {status === "success" && "Success"}
          {status === "error" && "Transaction failed"}
        </div>
        {message && <div className="opacity-90">{message}</div>}
        {txHash && (
          <a
            href={txUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium break-all"
          >
            View on Etherscan ↗
          </a>
        )}
      </div>
      {(status === "success" || status === "error") && onDismiss && (
        <button
          onClick={onDismiss}
          className="text-xs opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
