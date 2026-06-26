import React from "react";

// Small presentational helpers shared across dashboards.

export function Card({ title, subtitle, locked = false, children }) {
  return (
    <section
      className={`rounded-xl border bg-white p-4 shadow-sm sm:p-5 ${
        locked ? "border-gray-200 opacity-95" : "border-slate-200"
      }`}
    >
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          {locked && <span aria-hidden="true">🔒</span>}
          {title}
        </h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function TextField({ label, value, onChange, placeholder, disabled }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-xs font-medium text-slate-600">
          {label}
        </span>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
      />
    </label>
  );
}

export function TierHeading({ children }) {
  return (
    <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </h2>
  );
}
