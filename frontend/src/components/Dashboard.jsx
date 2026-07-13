import React from "react";
import OwnerDashboard from "./OwnerDashboard";
import ModeratorDashboard from "./ModeratorDashboard";
import UserDashboard from "./UserDashboard";
import { Icon } from "./ui";

// Routes to the matching dashboard by role. NONE gets a clear locked-out view that
// still shows every tier — disabled, each explaining why.
export default function Dashboard({ role, writeContract, onChange }) {
  const props = { role, writeContract, onChange };

  if (role === "OWNER") return <OwnerDashboard {...props} />;
  if (role === "MODERATOR") return <ModeratorDashboard {...props} />;
  if (role === "REGULAR_USER") return <UserDashboard {...props} />;

  return (
    <div className="space-y-8">
      <div className="animate-fade-up relative overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/50 p-8 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="relative mx-auto mb-5 grid h-16 w-16 place-items-center">
          <span className="absolute inset-0 rounded-2xl bg-slate-500/10 blur-xl" />
          <span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.08] bg-ink-900">
            <Icon.lock width="26" height="26" className="text-slate-500" />
          </span>
        </div>

        <h2 className="text-[20px] font-bold tracking-tight text-white">No role assigned</h2>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-slate-400">
          This wallet can read public on-chain data, but it cannot perform any gated action.
          Ask the owner to register your address, or connect a wallet that already holds a role.
        </p>

        <p className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11.5px] font-medium text-slate-500">
          <Icon.lock width="12" height="12" />
          Every action below is locked — each one explains why
        </p>
      </div>

      <UserDashboard {...props} />
    </div>
  );
}
