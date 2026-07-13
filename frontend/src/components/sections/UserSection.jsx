import React, { useState } from "react";
import { Card, TextField, Icon, Identicon } from "../ui";
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
    if (await tx.run(() => writeContract.updateProfile(newName), "Profile updated.")) {
      setNewName(""); onChange?.();
    }
  };

  const doFeedback = async () => {
    if (!feedback) return;
    if (await tx.run(() => writeContract.submitFeedback(feedback), "Feedback submitted on-chain.")) {
      setFeedback("");
    }
  };

  const loadProfile = async () => {
    setProfileErr(null);
    setLoadingProfile(true);
    try {
      // getMyProfile is onlyRole(REGULAR_USER) view — call via the signer contract.
      const p = await writeContract.getMyProfile();
      setProfile({
        username: p.username,
        address: p.userAddress,
        isActive: p.isActive,
        joinDate: new Date(Number(p.joinDate) * 1000).toLocaleDateString(undefined, {
          year: "numeric", month: "short", day: "numeric",
        }),
      });
    } catch {
      setProfileErr("Could not load profile (requires REGULAR_USER role).");
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card icon={Icon.edit} title="Edit profile" subtitle="Change your username" locked={locked}>
          <TextField label="New username" value={newName} onChange={setNewName} placeholder="new-name" />
          <ActionButton action="updateProfile" role={role} onClick={doUpdate} busy={busy}>
            Update profile
          </ActionButton>
        </Card>

        <Card icon={Icon.message} title="Submit feedback" subtitle="Recorded as an on-chain event" locked={locked}>
          <TextField label="Feedback" value={feedback} onChange={setFeedback} placeholder="Great app!" />
          <ActionButton action="submitFeedback" role={role} onClick={doFeedback} busy={busy}>
            Submit feedback
          </ActionButton>
        </Card>

        <Card icon={Icon.id} title="My profile" subtitle="Your on-chain record" locked={locked}>
          <ActionButton action="getMyProfile" role={role} onClick={loadProfile} busy={loadingProfile}>
            Load my profile
          </ActionButton>

          {profileErr && <p className="text-[12px] font-medium text-rose-400">{profileErr}</p>}

          {profile && (
            <div className="animate-fade-up rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-2.5">
                <Identicon address={profile.address} size={34} />
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-bold text-white">{profile.username}</div>
                  <div className="font-mono text-[10.5px] text-slate-500">
                    {profile.address.slice(0, 8)}…{profile.address.slice(-6)}
                  </div>
                </div>
              </div>
              <dl className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
                <div className="flex justify-between text-[12px]">
                  <dt className="text-slate-500">Status</dt>
                  <dd className={profile.isActive ? "font-semibold text-emerald-300" : "font-semibold text-slate-500"}>
                    {profile.isActive ? "Active" : "Inactive"}
                  </dd>
                </div>
                <div className="flex justify-between text-[12px]">
                  <dt className="text-slate-500">Joined</dt>
                  <dd className="font-semibold text-slate-300">{profile.joinDate}</dd>
                </div>
              </dl>
            </div>
          )}
        </Card>
      </div>

      <TxStatus status={tx.status} txHash={tx.txHash} message={tx.message} onDismiss={tx.reset} />
    </div>
  );
}
