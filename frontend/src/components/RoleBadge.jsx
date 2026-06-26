import React from "react";
import { ROLES } from "../config";

// Color-coded role badge: OWNER purple, MODERATOR orange, REGULAR_USER blue, NONE gray.
export default function RoleBadge({ role, loading }) {
  if (loading) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 animate-pulse">
        Detecting role…
      </span>
    );
  }
  const meta = ROLES[role] || ROLES.NONE;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${meta.badge}`}
      title={meta.description}
    >
      {meta.label}
    </span>
  );
}
