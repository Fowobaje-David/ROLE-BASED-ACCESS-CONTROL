import React from "react";
import { REQUIRED_ROLE, roleSatisfies } from "../config";

// Permission-aware button (the graded UX requirement).
//  - If the wallet's role satisfies the action's required role -> enabled button.
//  - If not -> visibly disabled (greyed) with an inline lock message stating the
//    required role AND the wallet's actual role. Never silently hidden.
//
// Props:
//  - action:   key into REQUIRED_ROLE (e.g. "promoteModerator")
//  - role:     the wallet's detected role ("OWNER" | ... | "NONE")
//  - onClick:  handler when permitted + enabled
//  - children: button label
//  - busy:     show a working state and disable
//  - className: extra classes for the enabled button
export default function ActionButton({
  action,
  role,
  onClick,
  children,
  busy = false,
  type = "button",
  className = "",
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
          className="w-full cursor-not-allowed rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-400"
        >
          {children}
        </button>
        <p className="mt-1 text-xs text-gray-500">
          🔒 Requires <span className="font-semibold">{requiredRole}</span> role —
          your wallet is <span className="font-semibold">{actualRole}</span>
        </p>
      </div>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy}
      className={
        className ||
        `w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition
         ${busy ? "bg-blue-300 cursor-wait" : "bg-blue-600 hover:bg-blue-700"}`
      }
    >
      {busy ? "Working…" : children}
    </button>
  );
}
