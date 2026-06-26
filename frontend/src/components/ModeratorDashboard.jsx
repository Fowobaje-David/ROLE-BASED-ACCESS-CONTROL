import React from "react";
import ModeratorSection from "./sections/ModeratorSection";
import UserSection from "./sections/UserSection";
import OwnerSection from "./sections/OwnerSection";
import { TierHeading } from "./ui";

// Moderator view: moderator + user actions enabled. Owner-only actions are shown
// but visibly disabled with a "why + required role" explanation.
export default function ModeratorDashboard({ role, writeContract, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <TierHeading>Moderation</TierHeading>
        <ModeratorSection role={role} writeContract={writeContract} onChange={onChange} />
      </div>

      <div>
        <TierHeading>User actions</TierHeading>
        <UserSection role={role} writeContract={writeContract} onChange={onChange} />
      </div>

      <div>
        <TierHeading>Owner tools — locked</TierHeading>
        <OwnerSection role={role} writeContract={writeContract} onChange={onChange} />
      </div>
    </div>
  );
}
