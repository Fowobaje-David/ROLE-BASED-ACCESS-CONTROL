import React, { useState } from "react";
import { isAddress } from "ethers";
import { Card, TextField, StatPill, Icon } from "../ui";
import ActionButton from "../ActionButton";
import TxStatus from "../TxStatus";
import { useTx } from "../../hooks/useTx";

// Moderator-tier actions: deactivate/reactivate users, approve content, user count.
export default function ModeratorSection({ role, writeContract, onChange }) {
  const tx = useTx();

  const [deactAddr, setDeactAddr] = useState("");
  const [reactAddr, setReactAddr] = useState("");
  const [approveAddr, setApproveAddr] = useState("");
  const [contentId, setContentId] = useState("");
  const [count, setCount] = useState(null);
  const [countErr, setCountErr] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);

  const busy = tx.status === "pending";
  const locked = role !== "OWNER" && role !== "MODERATOR";

  const guard = (addr) => {
    if (!isAddress(addr)) {
      tx.fail("Please enter a valid Ethereum address (0x…).");
      return false;
    }
    return true;
  };

  const doDeactivate = async () => {
    if (!guard(deactAddr)) return;
    if (await tx.run(() => writeContract.deactivateUser(deactAddr), "User deactivated.")) {
      setDeactAddr(""); onChange?.();
    }
  };

  const doReactivate = async () => {
    if (!guard(reactAddr)) return;
    if (await tx.run(() => writeContract.reactivateUser(reactAddr), "User reactivated.")) {
      setReactAddr(""); onChange?.();
    }
  };

  const doApprove = async () => {
    if (!guard(approveAddr) || !contentId) return;
    if (await tx.run(() => writeContract.approveUserContent(approveAddr, contentId), `Approved “${contentId}”.`)) {
      setApproveAddr(""); setContentId("");
    }
  };

  const loadCount = async () => {
    setCountErr(null);
    setLoadingCount(true);
    try {
      // getUserCount is onlyRole(MODERATOR) view — call via the signer contract.
      const c = await writeContract.getUserCount();
      setCount(c.toString());
    } catch {
      setCountErr("Could not load count (requires MODERATOR role).");
      setCount(null);
    } finally {
      setLoadingCount(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card icon={Icon.pause} title="Deactivate user" subtitle="Suspend an account" locked={locked}>
          <TextField label="Wallet address" value={deactAddr} onChange={setDeactAddr} placeholder="0x…" mono />
          <ActionButton action="deactivateUser" role={role} onClick={doDeactivate} busy={busy}>
            Deactivate
          </ActionButton>
        </Card>

        <Card icon={Icon.play} title="Reactivate user" subtitle="Restore a suspended account" locked={locked}>
          <TextField label="Wallet address" value={reactAddr} onChange={setReactAddr} placeholder="0x…" mono />
          <ActionButton action="reactivateUser" role={role} onClick={doReactivate} busy={busy}>
            Reactivate
          </ActionButton>
        </Card>

        <Card icon={Icon.check} title="Approve content" subtitle="Log an approval on-chain" locked={locked}>
          <TextField label="User address" value={approveAddr} onChange={setApproveAddr} placeholder="0x…" mono />
          <TextField label="Content ID" value={contentId} onChange={setContentId} placeholder="post-123" />
          <ActionButton action="approveUserContent" role={role} onClick={doApprove} busy={busy}>
            Approve content
          </ActionButton>
        </Card>

        <Card icon={Icon.chart} title="User stats" subtitle="Total registered users" locked={locked}>
          <ActionButton action="getUserCount" role={role} onClick={loadCount} busy={loadingCount}>
            Get user count
          </ActionButton>
          {count !== null && (
            <div className="animate-fade-up">
              <StatPill label="Registered users" value={count} tone="good" />
            </div>
          )}
          {countErr && <p className="text-[12px] font-medium text-rose-400">{countErr}</p>}
        </Card>
      </div>

      <TxStatus status={tx.status} txHash={tx.txHash} message={tx.message} onDismiss={tx.reset} />
    </div>
  );
}
