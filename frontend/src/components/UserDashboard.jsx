import React from "react";
import UserSection from "./sections/UserSection";
import ModeratorSection from "./sections/ModeratorSection";
import OwnerSection from "./sections/OwnerSection";
import { TierHeading } from "./ui";

// Regular-user view: user actions enabled. Higher-tier actions are still shown,
// but rendered visibly disabled with a "why + required role" explanation
// (per the permission-aware UX requirement).
export default function UserDashboard({ role, writeContract, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <TierHeading>Your actions</TierHeading>
        <UserSection role={role} writeContract={writeContract} onChange={onChange} />
      </div>

      <div>
        <TierHeading>Moderator tools — locked</TierHeading>
        <ModeratorSection role={role} writeContract={writeContract} onChange={onChange} />
      </div>

      <div>
        <TierHeading>Owner tools — locked</TierHeading>
        <OwnerSection role={role} writeContract={writeContract} onChange={onChange} />
      </div>
    </div>
  );
}
