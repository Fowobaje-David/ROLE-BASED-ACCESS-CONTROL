import React, { useState } from "react";
import { isAddress } from "ethers";
import { Card, TextField, Icon, Identicon } from "../ui";
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
  const locked = role !== "OWNER";

  const guard = (addr) => {
    if (!isAddress(addr)) {
      setUsersErr(null);
      tx.fail("Please enter a valid Ethereum address (0x…).");
      return false;
    }
    return true;
  };

  const doRegister = async () => {
    if (!guard(regAddr) || !regName) return;
    if (await tx.run(() => writeContract.registerUser(regAddr, regName), `Registered ${regName}.`)) {
      setRegAddr(""); setRegName(""); onChange?.();
    }
  };

  const doPromote = async () => {
    if (!guard(promoAddr) || !promoName) return;
    if (await tx.run(() => writeContract.promoteModerator(promoAddr, promoName), `${promoName} is now a moderator.`)) {
      setPromoAddr(""); setPromoName(""); onChange?.();
    }
  };

  const doRemove = async () => {
    if (!guard(removeAddr)) return;
    if (await tx.run(() => writeContract.removeUser(removeAddr), "User removed — roles revoked.")) {
      setRemoveAddr(""); onChange?.();
    }
  };

  const doSetting = async () => {
    if (!settingKey) return;
    if (await tx.run(() => writeContract.updateSystemSetting(settingKey, settingVal), `Setting “${settingKey}” saved.`)) {
      setSettingKey(""); setSettingVal("");
    }
  };

  const loadUsers = async () => {
    setUsersErr(null);
    setLoadingUsers(true);
    try {
      // getAllUsers is onlyRole(OWNER) view — must be called via the signer contract.
      setUsers(await writeContract.getAllUsers());
    } catch {
      setUsersErr("Could not load users (requires OWNER role).");
      setUsers(null);
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card icon={Icon.userPlus} title="Register user" subtitle="Grants the REGULAR_USER role" locked={locked}>
          <TextField label="Wallet address" value={regAddr} onChange={setRegAddr} placeholder="0x…" mono />
          <TextField label="Username" value={regName} onChange={setRegName} placeholder="alice" />
          <ActionButton action="registerUser" role={role} onClick={doRegister} busy={busy}>
            Register user
          </ActionButton>
        </Card>

        <Card icon={Icon.shield} title="Promote moderator" subtitle="Grants the MODERATOR role" locked={locked}>
          <TextField label="Wallet address" value={promoAddr} onChange={setPromoAddr} placeholder="0x…" mono />
          <TextField label="Username" value={promoName} onChange={setPromoName} placeholder="bob" />
          <ActionButton action="promoteModerator" role={role} onClick={doPromote} busy={busy}>
            Promote to moderator
          </ActionButton>
        </Card>

        <Card icon={Icon.userMinus} title="Remove user" subtitle="Deactivates and revokes all roles" locked={locked}>
          <TextField label="Wallet address" value={removeAddr} onChange={setRemoveAddr} placeholder="0x…" mono />
          <ActionButton action="removeUser" role={role} onClick={doRemove} busy={busy}>
            Remove user
          </ActionButton>
        </Card>

        <Card icon={Icon.sliders} title="System setting" subtitle="Write a key / value pair on-chain" locked={locked}>
          <TextField label="Key" value={settingKey} onChange={setSettingKey} placeholder="siteName" />
          <TextField label="Value" value={settingVal} onChange={setSettingVal} placeholder="MyDApp" />
          <ActionButton action="updateSystemSetting" role={role} onClick={doSetting} busy={busy}>
            Save setting
          </ActionButton>
        </Card>
      </div>

      <Card icon={Icon.users} title="User directory" subtitle="Everyone registered on the contract" locked={locked}>
        <ActionButton action="getAllUsers" role={role} onClick={loadUsers} busy={loadingUsers}>
          Load all users
        </ActionButton>

        {usersErr && <p className="text-[12px] font-medium text-rose-400">{usersErr}</p>}

        {users && (
          <div className="animate-fade-up mt-1 overflow-hidden rounded-xl border border-white/[0.07]">
            <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.02] px-3.5 py-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {users.length} {users.length === 1 ? "user" : "users"}
              </span>
            </div>
            <div className="max-h-72 divide-y divide-white/[0.05] overflow-y-auto">
              {users.map((u, i) => (
                <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 transition hover:bg-white/[0.02]">
                  <Identicon address={u.userAddress} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-slate-200">{u.username}</div>
                    <a
                      href={addressUrl(u.userAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-slate-500 transition hover:text-slate-300"
                    >
                      {u.userAddress.slice(0, 10)}…{u.userAddress.slice(-6)}
                    </a>
                  </div>
                  <span
                    className={`flex-none rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      u.isActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-white/[0.08] bg-white/[0.03] text-slate-500"
                    }`}
                  >
                    {u.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <TxStatus status={tx.status} txHash={tx.txHash} message={tx.message} onDismiss={tx.reset} />
    </div>
  );
}
