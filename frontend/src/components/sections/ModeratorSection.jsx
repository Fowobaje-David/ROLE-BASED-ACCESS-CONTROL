import React, { useState } from "react";
import { isAddress } from "ethers";
import { Card, TextField } from "../ui";
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

  const guardAddr = (addr) => {
    if (!isAddress(addr)) {
      window.alert("Please enter a valid address.");
      return false;
    }
    return true;
  };

  const doDeactivate = async () => {
    if (!guardAddr(deactAddr)) return;
    const ok = await tx.run(
      () => writeContract.deactivateUser(deactAddr),
      "User deactivated."
    );
    if (ok) {
      setDeactAddr("");
      onChange?.();
    }
  };

  const doReactivate = async () => {
    if (!guardAddr(reactAddr)) return;
    const ok = await tx.run(
      () => writeContract.reactivateUser(reactAddr),
      "User reactivated."
    );
    if (ok) {
      setReactAddr("");
      onChange?.();
    }
  };

  const doApprove = async () => {
    if (!guardAddr(approveAddr) || !contentId) return;
    const ok = await tx.run(
      () => writeContract.approveUserContent(approveAddr, contentId),
      `Content "${contentId}" approved.`
    );
    if (ok) {
      setApproveAddr("");
      setContentId("");
    }
  };

  const loadCount = async () => {
    setCountErr(null);
    setLoadingCount(true);
    try {
      // getUserCount is onlyRole(MODERATOR) view — call via signer contract.
      const c = await writeContract.getUserCount();
      setCount(c.toString());
    } catch (e) {
      setCountErr("Could not load count (requires MODERATOR role).");
      setCount(null);
    } finally {
      setLoadingCount(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Deactivate user" subtitle="Suspend a user account" locked={locked}>
        <TextField label="Address" value={deactAddr} onChange={setDeactAddr} placeholder="0x…" />
        <ActionButton action="deactivateUser" role={role} onClick={doDeactivate} busy={busy}>
          Deactivate
        </ActionButton>
      </Card>

      <Card title="Reactivate user" subtitle="Restore a suspended account" locked={locked}>
        <TextField label="Address" value={reactAddr} onChange={setReactAddr} placeholder="0x…" />
        <ActionButton action="reactivateUser" role={role} onClick={doReactivate} busy={busy}>
          Reactivate
        </ActionButton>
      </Card>

      <Card title="Approve content" subtitle="Log a content approval" locked={locked}>
        <TextField label="User address" value={approveAddr} onChange={setApproveAddr} placeholder="0x…" />
        <TextField label="Content ID" value={contentId} onChange={setContentId} placeholder="post-123" />
        <ActionButton action="approveUserContent" role={role} onClick={doApprove} busy={busy}>
          Approve Content
        </ActionButton>
      </Card>

      <Card title="User stats" subtitle="Total registered users" locked={locked}>
        <ActionButton action="getUserCount" role={role} onClick={loadCount} busy={loadingCount}>
          {loadingCount ? "Loading…" : "Get User Count"}
        </ActionButton>
        {count !== null && (
          <p className="text-sm text-slate-700">
            Total users: <span className="font-semibold">{count}</span>
          </p>
        )}
        {countErr && <p className="text-xs text-red-600">{countErr}</p>}
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
