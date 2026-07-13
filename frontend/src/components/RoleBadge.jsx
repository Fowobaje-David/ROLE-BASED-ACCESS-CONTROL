import React from "react";
import { ROLES } from "../config";

// Color-coded role badge: OWNER purple, MODERATOR orange, REGULAR_USER blue, NONE gray.
const STYLE = {
  OWNER: "border-owner/40 bg-owner/15 text-owner shadow-[0_0_20px_-6px_rgba(168,85,247,.6)]",
  MODERATOR: "border-moderator/40 bg-moderator/15 text-moderator shadow-[0_0_20px_-6px_rgba(245,158,11,.6)]",
  REGULAR_USER: "border-regular/40 bg-regular/15 text-regular shadow-[0_0_20px_-6px_rgba(59,130,246,.6)]",
  NONE: "border-white/10 bg-white/[0.04] text-slate-400",
};

const DOT = {
  OWNER: "bg-owner",
  MODERATOR: "bg-moderator",
  REGULAR_USER: "bg-regular",
  NONE: "bg-slate-500",
};

export default function RoleBadge({ role, loading }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500" />
        <span className="skeleton h-2.5 w-16" />
      </span>
    );
  }

  const key = ROLES[role] ? role : "NONE";
  const meta = ROLES[key];

  return (
    <span
      title={meta.description}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wider ${STYLE[key]}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {key !== "NONE" && (
          <span className={`absolute inline-flex h-full w-full animate-ping2 rounded-full opacity-60 ${DOT[key]}`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${DOT[key]}`} />
      </span>
      {meta.label}
    </span>
  );
}
