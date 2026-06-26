import React, { useState } from "react";
import { Card, TextField } from "../ui";
import ActionButton from "../ActionButton";
import TxStatus from "../TxStatus";
import { useTx } from "../../hooks/useTx";

// Regular-user-tier actions: edit profile, submit feedback, view own profile.
export default function UserSection({ role, writeContract, onChange }) {
  const tx = useTx();

  const [newName, setNewName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileErr, setProfileErr] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const busy = tx.status === "pending";
  const locked = role === "NONE" || !role;

  const doUpdate = async () => {
    if (!newName) return;
    const ok = await tx.run(
      () => writeContract.updateProfile(newName),
      "Profile updated."
    );
    if (ok) {
      setNewName("");
      onChange?.();
    }
  };

  const doFeedback = async () => {
    if (!feedback) return;
    const ok = await tx.run(
      () => writeContract.submitFeedback(feedback),
      "Feedback submitted."
    );
    if (ok) setFeedback("");
  };

  const loadProfile = async () => {
    setProfileErr(null);
    setLoadingProfile(true);
    try {
      // getMyProfile is onlyRole(REGULAR_USER) view — call via signer contract.
      const p = await writeContract.getMyProfile();
      setProfile({
        username: p.username,
        address: p.userAddress,
        isActive: p.isActive,
        joinDate: new Date(Number(p.joinDate) * 1000).toLocaleString(),
      });
    } catch (e) {
      setProfileErr("Could not load profile (requires REGULAR_USER role).");
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Edit profile" subtitle="Update your username" locked={locked}>
        <TextField label="New username" value={newName} onChange={setNewName} placeholder="new-name" />
        <ActionButton action="updateProfile" role={role} onClick={doUpdate} busy={busy}>
          Update Profile
        </ActionButton>
      </Card>

      <Card title="Submit feedback" subtitle="Send feedback on-chain" locked={locked}>
        <TextField label="Feedback" value={feedback} onChange={setFeedback} placeholder="Great app!" />
        <ActionButton action="submitFeedback" role={role} onClick={doFeedback} busy={busy}>
          Submit Feedback
        </ActionButton>
      </Card>

      <Card title="My profile" subtitle="View your own info" locked={locked}>
        <ActionButton action="getMyProfile" role={role} onClick={loadProfile} busy={loadingProfile}>
          {loadingProfile ? "Loading…" : "Load My Profile"}
        </ActionButton>
        {profileErr && <p className="text-xs text-red-600">{profileErr}</p>}
        {profile && (
          <dl className="mt-1 space-y-1 text-sm text-slate-700">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Username</dt>
              <dd className="font-medium">{profile.username}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Active</dt>
              <dd>{profile.isActive ? "✅ Active" : "— Inactive"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Joined</dt>
              <dd>{profile.joinDate}</dd>
            </div>
          </dl>
        )}
      </Card>

      <div className="lg:col-span-2">
        <TxStatus
          status={tx.status}
          txHash={tx.txHash}
          message={tx.message}
          onDismiss={tx.reset}
        />
      </div>
    </div>
  );
}
