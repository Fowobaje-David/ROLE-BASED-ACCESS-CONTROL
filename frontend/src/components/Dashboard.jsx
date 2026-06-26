import React from "react";
import OwnerDashboard from "./OwnerDashboard";
import ModeratorDashboard from "./ModeratorDashboard";
import UserDashboard from "./UserDashboard";
import { ROLES } from "../config";

// Routes to the matching dashboard by role. NONE gets a clear locked-out view
// that still shows what is available at each tier (all disabled, with reasons).
export default function Dashboard({ role, writeContract, onChange }) {
  if (role === "OWNER") {
    return <OwnerDashboard role={role} writeContract={writeContract} onChange={onChange} />;
  }
  if (role === "MODERATOR") {
    return <ModeratorDashboard role={role} writeContract={writeContract} onChange={onChange} />;
  }
  if (role === "REGULAR_USER") {
    return <UserDashboard role={role} writeContract={writeContract} onChange={onChange} />;
  }

  // NONE — locked-out state with messaging.
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
        <div className="text-3xl">🔒</div>
        <h2 className="mt-2 text-lg font-semibold text-slate-800">
          No role assigned
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
          {ROLES.NONE.description} This wallet can read public on-chain data but
          cannot perform any gated action. Ask the owner to register your address,
          or connect a wallet that has been granted a role.
        </p>
      </div>

      {/* Show the tiers so it's clear what's locked and why. */}
      <UserDashboard role={role} writeContract={writeContract} onChange={onChange} />
    </div>
  );
}
