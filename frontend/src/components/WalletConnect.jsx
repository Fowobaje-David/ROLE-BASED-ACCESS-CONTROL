import React, { useState } from "react";
import { addressUrl } from "../config";
import { Icon, Identicon } from "./ui";

const shorten = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export default function WalletConnect({
  hasMetaMask,
  account,
  balance,
  connecting,
  wrongNetwork,
  error,
  onConnect,
  onDisconnect,
  onSwitchAccount,
  onSwitchNetwork,
  variant = "bar",
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(account).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  /* ---------------------------------------------------- no wallet extension */
  if (!hasMetaMask) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10
                   px-4 py-2.5 text-[13px] font-semibold text-amber-300 transition hover:bg-amber-500/15"
      >
        <Icon.alert width="15" height="15" />
        Install MetaMask
      </a>
    );
  }

  /* ------------------------------------------------------------ not connected */
  if (!account) {
    const big = variant === "hero";
    return (
      <div className={big ? "flex flex-col items-center gap-3" : "flex flex-col items-end gap-2"}>
        <button
          type="button"
          onClick={onConnect}
          disabled={connecting}
          className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl
                      bg-gradient-to-b from-brand-500 to-brand-600 font-semibold text-white shadow-glow
                      transition hover:from-brand-400 hover:to-brand-500 active:scale-[.985]
                      disabled:cursor-wait disabled:opacity-70
                      ${big ? "px-7 py-3.5 text-[15px]" : "px-4 py-2.5 text-[13.5px]"}`}
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {connecting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Connecting…
            </>
          ) : (
            <>
              <Icon.power width={big ? 17 : 15} height={big ? 17 : 15} />
              Connect Wallet
            </>
          )}
        </button>
        {error && <p className="text-[12px] font-medium text-rose-400">{error}</p>}
      </div>
    );
  }

  /* ---------------------------------------------------------------- connected */
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {wrongNetwork ? (
        <button
          type="button"
          onClick={onSwitchNetwork}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-amber-500/12
                     px-3 py-2 text-[12px] font-bold text-amber-300 transition hover:bg-amber-500/20"
        >
          <Icon.alert width="13" height="13" />
          Switch to Sepolia
        </button>
      ) : (
        <span className="hidden items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[11.5px] font-semibold text-slate-400 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Sepolia
        </span>
      )}

      {/* account chip */}
      <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-ink-850/80 py-1.5 pl-1.5 pr-2.5 backdrop-blur">
        <Identicon address={account} size={28} />
        <div className="leading-tight">
          <button
            type="button"
            onClick={copy}
            title="Copy address"
            className="block font-mono text-[12.5px] font-semibold text-slate-200 transition hover:text-white"
          >
            {copied ? "Copied ✓" : shorten(account)}
          </button>
          {balance !== null && (
            <span className="block text-[10.5px] font-medium text-slate-500">
              {Number(balance).toFixed(4)} ETH
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onSwitchAccount}
        title="Switch account"
        className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]
                   text-slate-400 transition hover:border-white/[0.16] hover:text-white"
      >
        <Icon.swap width="15" height="15" />
      </button>

      <a
        href={addressUrl(account)}
        target="_blank"
        rel="noopener noreferrer"
        title="View on Etherscan"
        className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]
                   text-slate-400 transition hover:border-white/[0.16] hover:text-white"
      >
        <Icon.link width="15" height="15" />
      </a>

      <button
        type="button"
        onClick={onDisconnect}
        title="Disconnect"
        className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]
                   text-slate-400 transition hover:border-rose-500/40 hover:text-rose-400"
      >
        <Icon.power width="15" height="15" />
      </button>
    </div>
  );
}
