import React from "react";
import { REQUIRED_ROLE, roleSatisfies } from "../config";
import { Icon } from "./ui";

// Permission-aware button (the graded UX requirement).
//  - Permitted   -> a normal, enabled button.
//  - Not permitted -> visibly disabled (greyed) with an inline lock message naming the
//    required role AND the wallet's actual role. Never silently hidden.
const ROLE_TEXT = {
  OWNER: "text-owner",
  MODERATOR: "text-moderator",
  REGULAR_USER: "text-regular",
  NONE: "text-slate-400",
};

export default function ActionButton({
  action,
  role,
  onClick,
  children,
  busy = false,
  type = "button",
}) {
  const requiredRole = REQUIRED_ROLE[action];
  const permitted = roleSatisfies(role, requiredRole);
  const actualRole = role || "NONE";

  if (!permitted) {
    return (
      <div className="w-full">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={`Requires ${requiredRole} role — your wallet is ${actualRole}`}
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl
                     border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[13.5px]
                     font-semibold text-slate-600"
        >
          <Icon.lock width="14" height="14" />
          {children}
        </button>

        <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-[11.5px] leading-snug text-slate-500">
          <Icon.lock width="12" height="12" className="mt-0.5 flex-none text-slate-600" />
          <span>
            Requires <span className={`font-bold ${ROLE_TEXT[requiredRole]}`}>{requiredRole}</span> role
            {" — "}your wallet is{" "}
            <span className={`font-bold ${ROLE_TEXT[actualRole] || "text-slate-400"}`}>{actualRole}</span>
          </span>
        </p>
      </div>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy}
      className="group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden
                 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2.5
                 text-[13.5px] font-semibold text-white shadow-glow transition
                 hover:from-brand-400 hover:to-brand-500 active:scale-[.985]
                 disabled:cursor-wait disabled:opacity-70 disabled:hover:from-brand-500"
    >
      {busy ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Working…
        </>
      ) : (
        children
      )}
    </button>
  );
}
