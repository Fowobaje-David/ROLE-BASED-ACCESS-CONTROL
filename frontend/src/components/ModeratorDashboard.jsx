import React from "react";
import ModeratorSection from "./sections/ModeratorSection";
import UserSection from "./sections/UserSection";
import OwnerSection from "./sections/OwnerSection";
import { TierHeading } from "./ui";

// Moderator view: moderator + user actions enabled. Owner-only actions are still
// shown, but visibly disabled with a "why + required role" explanation.
export default function ModeratorDashboard({ role, writeContract, onChange }) {
  const p = { role, writeContract, onChange };
  return (
    <div className="space-y-10">
      <div>
        <TierHeading hint="Available to you">Moderation</TierHeading>
        <ModeratorSection {...p} />
      </div>
      <div>
        <TierHeading hint="Available to you">Your account</TierHeading>
        <UserSection {...p} />
      </div>
      <div>
        <TierHeading hint="Requires OWNER" locked>
          Owner tools — locked
        </TierHeading>
        <OwnerSection {...p} />
      </div>
    </div>
  );
}
