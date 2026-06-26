import React, { useState } from "react";
import { isAddress } from "ethers";
import { Card, TextField } from "../ui";
import ActionButton from "../ActionButton";
import TxStatus from "../TxStatus";
import { useTx } from "../../hooks/useTx";
import { addressUrl } from "../../config";

// Owner-tier actions: register/remove users, promote moderators, system settings,
// all-users table. Buttons are permission-aware via ActionButton(role).
export default function OwnerSection({ role, writeContract, onChange }) {
  const tx = useTx();

  const [regAddr, setRegAddr] = useState("");
  const [regName, setRegName] = useState("");
  const [promoAddr, setPromoAddr] = useState("");
  const [promoName, setPromoName] = useState("");
  const [removeAddr, setRemoveAddr] = useState("");
  const [settingKey, setSettingKey] = useState("");
  const [settingVal, setSettingVal] = useState("");

  const [users, setUsers] = useState(null);
  const [usersErr, setUsersErr] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const busy = tx.status === "pending";

  const guardAddr = (addr) => {
    if (!isAddress(addr)) {
      tx.reset();
      window.alert("Please enter a valid address.");
      return false;
    }
    return true;
  };

  const doRegister = async () => {
    if (!guardAddr(regAddr) || !regName) return;
    const ok = await tx.run(
      () => writeContract.registerUser(regAddr, regName),
      `Registered ${regName} as a regular user.`
    );
    if (ok) {
      setRegAddr("");
      setRegName("");
      onChange?.();
    }
  };

  const doPromote = async () => {
    if (!guardAddr(promoAddr) || !promoName) return;
    const ok = await tx.run(
      () => writeContract.promoteModerator(promoAddr, promoName),
      `Promoted ${promoName} to moderator.`
    );
    if (ok) {
      setPromoAddr("");
      setPromoName("");
      onChange?.();
    }
  };

  const doRemove = async () => {
    if (!guardAddr(removeAddr)) return;
    const ok = await tx.run(
      () => writeContract.removeUser(removeAddr),
      "User removed (deactivated and roles revoked)."
    );
    if (ok) {
      setRemoveAddr("");
      onChange?.();
    }
  };

  const doSetting = async () => {
    if (!settingKey) return;
    const ok = await tx.run(
      () => writeContract.updateSystemSetting(settingKey, settingVal),
      `Setting "${settingKey}" updated.`
    );
    if (ok) {
      setSettingKey("");
      setSettingVal("");
    }
  };

  const loadUsers = async () => {
    setUsersErr(null);
    setLoadingUsers(true);
    try {
      // getAllUsers is onlyRole(OWNER) view — must be called via signer contract.
      const result = await writeContract.getAllUsers();
      setUsers(result);
    } catch (e) {
      setUsersErr("Could not load users (requires OWNER role).");
      setUsers(null);
    } finally {
      setLoadingUsers(false);
    }
  };

  const locked = role !== "OWNER";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Register user" subtitle="Grant REGULAR_USER role" locked={locked}>
        <TextField label="Address" value={regAddr} onChange={setRegAddr} placeholder="0x…" />
        <TextField label="Username" value={regName} onChange={setRegName} placeholder="alice" />
        <ActionButton action="registerUser" role={role} onClick={doRegister} busy={busy}>
          Register User
        </ActionButton>
      </Card>

      <Card title="Promote moderator" subtitle="Grant MODERATOR role" locked={locked}>
        <TextField label="Address" value={promoAddr} onChange={setPromoAddr} placeholder="0x…" />
        <TextField label="Username" value={promoName} onChange={setPromoName} placeholder="bob" />
        <ActionButton action="promoteModerator" role={role} onClick={doPromote} busy={busy}>
          Promote Moderator
        </ActionButton>
      </Card>

      <Card title="Remove user" subtitle="Deactivate + revoke roles" locked={locked}>
        <TextField label="Address" value={removeAddr} onChange={setRemoveAddr} placeholder="0x…" />
        <ActionButton action="removeUser" role={role} onClick={doRemove} busy={busy}>
          Remove User
        </ActionButton>
      </Card>

      <Card title="System setting" subtitle="Write a key/value setting" locked={locked}>
        <TextField label="Key" value={settingKey} onChange={setSettingKey} placeholder="siteName" />
        <TextField label="Value" value={settingVal} onChange={setSettingVal} placeholder="MyDApp" />
        <ActionButton action="updateSystemSetting" role={role} onClick={doSetting} busy={busy}>
          Update Setting
        </ActionButton>
      </Card>

      <Card title="All users" subtitle="Owner-only directory" locked={locked} >
        <ActionButton action="getAllUsers" role={role} onClick={loadUsers} busy={loadingUsers}>
          {loadingUsers ? "Loading…" : "Load All Users"}
        </ActionButton>
        {usersErr && <p className="text-xs text-red-600">{usersErr}</p>}
        {users && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1 pr-2">Username</th>
                  <th className="py-1 pr-2">Address</th>
                  <th className="py-1 pr-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1 pr-2">{u.username}</td>
                    <td className="py-1 pr-2 font-mono">
                      <a
                        href={addressUrl(u.userAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-dotted"
                      >
                        {u.userAddress.slice(0, 6)}…{u.userAddress.slice(-4)}
                      </a>
                    </td>
                    <td className="py-1 pr-2">{u.isActive ? "✅" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
