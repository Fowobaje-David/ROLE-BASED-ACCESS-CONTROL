import React from "react";
import { addressUrl } from "../config";

function shorten(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

// Wallet connect bar: connect button, address + balance, network warning + switch.
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
}) {
  if (!hasMetaMask) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        MetaMask not detected.{" "}
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          Install MetaMask
        </a>{" "}
        to connect a wallet.
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-start gap-2">
        <button
          onClick={onConnect}
          disabled={connecting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <a
          href={addressUrl(account)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono font-medium text-slate-800 underline decoration-dotted"
          title={account}
        >
          {shorten(account)}
        </a>
        {balance !== null && (
          <span className="text-slate-500">
            {Number(balance).toFixed(4)} ETH
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {wrongNetwork && (
          <button
            onClick={onSwitchNetwork}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
          >
            Switch to Sepolia
          </button>
        )}
        <button
          onClick={onSwitchAccount}
          className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Switch account
        </button>
        <button
          onClick={onDisconnect}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
