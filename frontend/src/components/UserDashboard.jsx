import React from "react";
import UserSection from "./sections/UserSection";
import ModeratorSection from "./sections/ModeratorSection";
import OwnerSection from "./sections/OwnerSection";
import { TierHeading } from "./ui";

// Regular-user view: user actions enabled. Higher-tier actions are still shown,
// but rendered visibly disabled with a "why + required role" explanation
// (the permission-aware UX requirement).
export default function UserDashboard({ role, writeContract, onChange }) {
  const p = { role, writeContract, onChange };
  const none = role === "NONE" || !role;

  return (
    <div className="space-y-10">
      <div>
        <TierHeading hint={none ? "Requires REGULAR_USER" : "Available to you"} locked={none}>
          {none ? "Your account — locked" : "Your account"}
        </TierHeading>
        <UserSection {...p} />
      </div>
      <div>
        <TierHeading hint="Requires MODERATOR" locked>
          Moderator tools — locked
        </TierHeading>
        <ModeratorSection {...p} />
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
