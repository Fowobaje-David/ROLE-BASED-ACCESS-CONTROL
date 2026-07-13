import React from "react";
import { useWallet } from "./hooks/useWallet";
import { useContract } from "./hooks/useContract";
import { useRole } from "./hooks/useRole";
import WalletConnect from "./components/WalletConnect";
import RoleBadge from "./components/RoleBadge";
import Dashboard from "./components/Dashboard";
import { Icon, ROLE_BLURB } from "./components/ui";
import { CONTRACT_ADDRESS, addressUrl, ROLES } from "./config";

export default function App() {
  const wallet = useWallet();
  const { readContract, writeContract, configured } = useContract(wallet.account);
  const { role, loading: roleLoading, refresh: refreshRole } = useRole(readContract, wallet.account);

  const connected = !!wallet.account;
  const onChain = !wallet.wrongNetwork;
  const meta = ROLES[role] || ROLES.NONE;

  return (
    <div className="min-h-screen">
      {/* ───────────────────────────── header ───────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[62px] max-w-6xl items-center gap-4 px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-600 to-brand-700 shadow-glow">
              <Icon.shield width="16" height="16" className="text-white" />
            </span>
            <div className="leading-none">
              <div className="text-[15px] font-bold tracking-tight text-white">Admin Panel</div>
              <div className="mt-0.5 hidden text-[10.5px] font-medium text-slate-500 sm:block">
                Role-based access control
              </div>
            </div>
          </div>

          {connected && onChain && (
            <div className="ml-1">
              <RoleBadge role={role} loading={roleLoading} />
            </div>
          )}

          <div className="ml-auto">
            <WalletConnect
              hasMetaMask={wallet.hasMetaMask}
              account={wallet.account}
              balance={wallet.balance}
              connecting={wallet.connecting}
              wrongNetwork={wallet.wrongNetwork}
              error={wallet.error}
              onConnect={wallet.connect}
              onDisconnect={wallet.disconnect}
              onSwitchAccount={wallet.switchAccount}
              onSwitchNetwork={wallet.switchToSepolia}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* ─────────────────────── contract not configured ─────────────────────── */}
        {!configured && (
          <Banner tone="amber" icon={Icon.alert} title="No contract address configured">
            Set <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[12px]">REACT_APP_CONTRACT_ADDRESS</code>{" "}
            in <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[12px]">frontend/.env.local</code> and
            restart the dev server.
          </Banner>
        )}

        {/* ───────────────────────────── connect ───────────────────────────── */}
        {configured && !connected && (
          <div className="animate-fade-up mx-auto max-w-xl pt-10 text-center">
            <div className="relative mx-auto mb-7 grid h-20 w-20 place-items-center">
              <span className="absolute inset-0 rounded-3xl bg-brand-600/20 blur-2xl" />
              <span className="relative grid h-20 w-20 place-items-center rounded-3xl border border-white/[0.08] bg-ink-850">
                <Icon.shield width="34" height="34" className="text-brand-400" />
              </span>
            </div>

            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-white sm:text-[36px]">
              Permissions,{" "}
              <span className="bg-gradient-to-r from-brand-400 to-regular bg-clip-text text-transparent">
                enforced on-chain
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-slate-400">
              Connect a wallet on the Sepolia testnet. The contract decides your role — and this panel
              shows you exactly what you can and cannot do.
            </p>

            <div className="mt-8 flex justify-center">
              <WalletConnect
                variant="hero"
                hasMetaMask={wallet.hasMetaMask}
                account={wallet.account}
                balance={wallet.balance}
                connecting={wallet.connecting}
                wrongNetwork={wallet.wrongNetwork}
                error={wallet.error}
                onConnect={wallet.connect}
                onDisconnect={wallet.disconnect}
                onSwitchAccount={wallet.switchAccount}
                onSwitchNetwork={wallet.switchToSepolia}
              />
            </div>

            {/* role legend */}
            <div className="mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {["OWNER", "MODERATOR", "REGULAR_USER", "NONE"].map((r) => (
                <div
                  key={r}
                  className="rounded-xl border border-white/[0.07] bg-ink-850/50 px-3 py-3 text-left transition hover:border-white/[0.13]"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT[r]}`} />
                    <span className={`text-[10.5px] font-bold tracking-wider ${TEXT[r]}`}>{r}</span>
                  </div>
                  <p className="text-[11px] leading-snug text-slate-500">{ROLE_BLURB[r]}</p>
                </div>
              ))}
            </div>

            {CONTRACT_ADDRESS && (
              <a
                href={addressUrl(CONTRACT_ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-slate-600 transition hover:text-slate-400"
              >
                <Icon.link width="12" height="12" />
                <span className="font-mono">{CONTRACT_ADDRESS}</span>
              </a>
            )}
          </div>
        )}

        {/* ─────────────────────────── wrong network ─────────────────────────── */}
        {configured && connected && !onChain && (
          <Banner tone="amber" icon={Icon.alert} title="Wrong network">
            This app runs on <strong className="text-amber-200">Sepolia</strong> (chain ID 11155111).{" "}
            <button
              type="button"
              onClick={wallet.switchToSepolia}
              className="font-semibold text-amber-200 underline underline-offset-2 hover:text-white"
            >
              Switch network
            </button>
            .
          </Banner>
        )}

        {/* ───────────────────────────── dashboard ───────────────────────────── */}
        {configured && connected && onChain && (
          <div className="animate-fade-up">
            {/* role summary strip */}
            <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-ink-850/50 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2.5">
                  <h1 className="text-[19px] font-bold tracking-tight text-white">
                    {TITLE[role] || "Dashboard"}
                  </h1>
                  <RoleBadge role={role} loading={roleLoading} />
                </div>
                <p className="text-[13px] leading-snug text-slate-500">{meta.description}</p>
              </div>
              <a
                href={addressUrl(CONTRACT_ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03]
                           px-3 py-2 text-[12px] font-semibold text-slate-400 transition hover:border-white/[0.16] hover:text-white"
              >
                <Icon.book width="14" height="14" />
                Contract
              </a>
            </div>

            <Dashboard
              role={role || "NONE"}
              writeContract={writeContract}
              onChange={() => {
                refreshRole();
                wallet.refreshBalance(wallet.account);
              }}
            />
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-5 pb-10 pt-6">
        <div className="flex flex-col items-center gap-2 border-t border-white/[0.06] pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-[11.5px] text-slate-600">
            Permission-tiered admin panel · Sepolia testnet · ethers v6
          </p>
          <p className="text-[11.5px] text-slate-600">
            Permissions enforced on-chain by the smart contract
          </p>
        </div>
      </footer>
    </div>
  );
}

const DOT = {
  OWNER: "bg-owner",
  MODERATOR: "bg-moderator",
  REGULAR_USER: "bg-regular",
  NONE: "bg-slate-500",
};
const TEXT = {
  OWNER: "text-owner",
  MODERATOR: "text-moderator",
  REGULAR_USER: "text-regular",
  NONE: "text-slate-400",
};
const TITLE = {
  OWNER: "Owner console",
  MODERATOR: "Moderator console",
  REGULAR_USER: "Your account",
  NONE: "No access",
};

function Banner({ tone, icon: I, title, children }) {
  const tones = {
    amber: "border-amber-500/25 bg-amber-500/[0.07] text-amber-300",
    rose: "border-rose-500/25 bg-rose-500/[0.07] text-rose-300",
  };
  return (
    <div className={`animate-fade-up mb-7 flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${tones[tone]}`}>
      {I && <I width="18" height="18" className="mt-0.5 flex-none" />}
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="mt-0.5 text-[12.5px] leading-relaxed text-slate-400">{children}</div>
      </div>
    </div>
  );
}
