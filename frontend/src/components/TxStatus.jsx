import React from "react";
import { txUrl } from "../config";
import { Icon } from "./ui";

// Transaction feedback: pending -> success (with Sepolia Etherscan link) -> or a
// human-readable error.
export default function TxStatus({ status, txHash, message, onDismiss }) {
  if (status === "idle") return null;

  const tone = {
    pending: {
      wrap: "border-amber-500/25 bg-amber-500/[0.07]",
      accent: "text-amber-300",
      title: "Transaction pending",
    },
    success: {
      wrap: "border-emerald-500/25 bg-emerald-500/[0.07]",
      accent: "text-emerald-300",
      title: "Confirmed on-chain",
    },
    error: {
      wrap: "border-rose-500/25 bg-rose-500/[0.07]",
      accent: "text-rose-300",
      title: "Transaction failed",
    },
  }[status];

  return (
    <div
      role="status"
      className={`animate-fade-up relative flex items-start gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 ${tone.wrap}`}
    >
      {status === "pending" && (
        <span className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
          <span className="block h-full w-1/3 animate-shimmer bg-amber-400/70" />
        </span>
      )}

      <span className={`mt-0.5 flex-none ${tone.accent}`}>
        {status === "pending" && (
          <svg className="h-[18px] w-[18px] animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {status === "success" && <Icon.check width="18" height="18" />}
        {status === "error" && <Icon.alert width="18" height="18" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className={`text-[13.5px] font-semibold ${tone.accent}`}>{tone.title}</div>
        {message && (
          <div className="mt-0.5 break-words text-[12.5px] leading-snug text-slate-400">{message}</div>
        )}
        {txHash && (
          <a
            href={txUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.04]
                       px-2.5 py-1 text-[11.5px] font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Icon.link width="12" height="12" />
            View on Etherscan
          </a>
        )}
      </div>

      {(status === "success" || status === "error") && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex-none rounded-md p-1 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
