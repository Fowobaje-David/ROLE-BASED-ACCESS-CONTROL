import React from "react";

/* ------------------------------------------------------------------ icons */
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export const Icon = {
  userPlus: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M15 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>),
  shield: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" /><path d="M9.5 12l1.8 1.8L15 10" /></svg>),
  userMinus: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M15 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M22 11h-6" /></svg>),
  sliders: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="7" cy="18" r="2" /></svg>),
  users: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 20v-2a4 4 0 00-3-3.87M16 3.13A4 4 0 0119 7" /></svg>),
  pause: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></svg>),
  play: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><circle cx="12" cy="12" r="9" /><path d="M10 8.5l6 3.5-6 3.5v-7z" /></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M20 6L9 17l-5-5" /></svg>),
  chart: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M3 20h18M7 16v-5M12 16V7M17 16v-8" /></svg>),
  edit: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>),
  message: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M21 11.5a8.4 8.4 0 01-9 8.4 9 9 0 01-4-.9L3 21l1.9-4.9A8.4 8.4 0 0112 3.5a8.4 8.4 0 019 8z" /></svg>),
  id: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2.2" /><path d="M5.5 16.5c.7-1.6 5.3-1.6 7 0M15 10h4M15 14h4" /></svg>),
  lock: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>),
  link: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.5-1.5" /><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7L12 5" /></svg>),
  power: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M12 4v8" /><path d="M6.3 6.3a8 8 0 1011.4 0" /></svg>),
  swap: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M7 4L3 8l4 4" /><path d="M3 8h13a4 4 0 014 4" /><path d="M17 20l4-4-4-4" /><path d="M21 16H8a4 4 0 01-4-4" /></svg>),
  alert: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M12 3l9.5 17H2.5L12 3z" /><path d="M12 9.5v4.5M12 17.5h.01" /></svg>),
  book: (p) => (<svg viewBox="0 0 24 24" {...S} {...p}><path d="M4 4.5A2.5 2.5 0 016.5 2H20v18H6.5A2.5 2.5 0 004 22V4.5z" /><path d="M8 7h8M8 11h5" /></svg>),
};

/* ------------------------------------------------------------ role blurbs */
export const ROLE_BLURB = {
  OWNER: "Full control — users, roles, settings.",
  MODERATOR: "Moderate users and approve content.",
  REGULAR_USER: "Manage your own profile and feedback.",
  NONE: "Read-only. No gated actions.",
};

/* ------------------------------------------------- deterministic identicon */
export function Identicon({ address, size = 34, className = "" }) {
  const a = (address || "0x0").toLowerCase();
  let h = 0;
  for (let i = 2; i < a.length; i++) h = (h * 31 + a.charCodeAt(i)) >>> 0;
  const h1 = h % 360;
  const h2 = (h1 + 60 + (h % 90)) % 360;
  const angle = h % 360;
  return (
    <span
      className={`inline-block flex-none rounded-full ring-1 ring-white/15 ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(${angle}deg, hsl(${h1} 75% 58%), hsl(${h2} 75% 45%))`,
      }}
      aria-hidden="true"
    />
  );
}

/* ----------------------------------------------------------------- surface */
export function Card({ icon: I, title, subtitle, locked = false, children, className = "" }) {
  return (
    <section
      className={`group relative overflow-hidden rounded-2xl border p-5 transition duration-300
        ${locked
          ? "border-white/[0.06] bg-ink-900/50"
          : "border-white/[0.08] bg-ink-850/70 hover:border-white/[0.14] hover:shadow-card"}
        ${className}`}
    >
      {/* top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="mb-4 flex items-start gap-3">
        {I && (
          <span
            className={`grid h-9 w-9 flex-none place-items-center rounded-xl border transition
              ${locked
                ? "border-white/[0.06] bg-white/[0.03] text-slate-600"
                : "border-brand-500/25 bg-brand-600/15 text-brand-400 group-hover:bg-brand-600/25"}`}
          >
            <I width="17" height="17" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className={`flex items-center gap-1.5 text-[15px] font-semibold tracking-tight ${locked ? "text-slate-400" : "text-white"}`}>
            {locked && <Icon.lock width="13" height="13" className="text-slate-500" />}
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="space-y-3">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------- input */
export function TextField({ label, value, onChange, placeholder, disabled, mono = false }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck="false"
        className={`w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3.5 py-2.5 text-[13.5px]
          text-slate-100 placeholder:text-slate-600 transition
          hover:border-white/[0.14]
          focus:border-brand-500/60 focus:bg-ink-950 focus:outline-none focus:ring-4 focus:ring-brand-600/15
          disabled:cursor-not-allowed disabled:opacity-50
          ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

/* ---------------------------------------------------------- tier heading */
export function TierHeading({ children, hint, locked = false }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className={`text-[11px] font-bold uppercase tracking-[0.14em] ${locked ? "text-slate-600" : "text-slate-400"}`}>
        {children}
      </h2>
      {hint && (
        <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10.5px] font-medium text-slate-500">
          {hint}
        </span>
      )}
      <div className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
    </div>
  );
}

export function StatPill({ label, value, tone = "default" }) {
  const tones = {
    default: "border-white/[0.08] bg-white/[0.03] text-slate-300",
    good: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  };
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${tones[tone]}`}>
      <span className="text-[12.5px] text-slate-500">{label}</span>
      <span className="text-[13.5px] font-semibold">{value}</span>
    </div>
  );
}
