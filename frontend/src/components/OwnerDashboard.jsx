import React from "react";
import OwnerSection from "./sections/OwnerSection";
import ModeratorSection from "./sections/ModeratorSection";
import UserSection from "./sections/UserSection";
import { TierHeading } from "./ui";

// Owner view: full control — owner, moderator, and user actions all enabled.
export default function OwnerDashboard({ role, writeContract, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <TierHeading>User & role management</TierHeading>
        <OwnerSection role={role} writeContract={writeContract} onChange={onChange} />
      </div>

      <div>
        <TierHeading>Moderation</TierHeading>
        <ModeratorSection role={role} writeContract={writeContract} onChange={onChange} />
      </div>

      <div>
        <TierHeading>User actions</TierHeading>
        <UserSection role={role} writeContract={writeContract} onChange={onChange} />
      </div>
    </div>
  );
}
