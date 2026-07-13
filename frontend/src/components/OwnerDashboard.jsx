import React from "react";
import OwnerSection from "./sections/OwnerSection";
import ModeratorSection from "./sections/ModeratorSection";
import UserSection from "./sections/UserSection";
import { TierHeading } from "./ui";

// Owner view: full control — owner, moderator, and user actions all enabled.
export default function OwnerDashboard({ role, writeContract, onChange }) {
  const p = { role, writeContract, onChange };
  return (
    <div className="space-y-10">
      <div>
        <TierHeading hint="Owner only">User &amp; role management</TierHeading>
        <OwnerSection {...p} />
      </div>
      <div>
        <TierHeading hint="Moderator">Moderation</TierHeading>
        <ModeratorSection {...p} />
      </div>
      <div>
        <TierHeading hint="Everyone">Your account</TierHeading>
        <UserSection {...p} />
      </div>
    </div>
  );
}
