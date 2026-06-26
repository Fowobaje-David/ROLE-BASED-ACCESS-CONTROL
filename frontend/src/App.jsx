import React from "react";
import { useWallet } from "./hooks/useWallet";
import { useContract } from "./hooks/useContract";
import { useRole } from "./hooks/useRole";
import WalletConnect from "./components/WalletConnect";
import RoleBadge from "./components/RoleBadge";
import Dashboard from "./components/Dashboard";
import { CONTRACT_ADDRESS, addressUrl } from "./config";

export default function App() {
  const wallet = useWallet();
  const { readContract, writeContract, configured } = useContract(wallet.account);
  const { role, loading: roleLoading, refresh: refreshRole } = useRole(
    readContract,
    wallet.account
  );

  const connected = !!wallet.account;
  const onChain = !wallet.wrongNetwork;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-800">Admin Panel</h1>
            {connected && <RoleBadge role={role} loading={roleLoading} />}
          </div>
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
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Contract not configured */}
        {!configured && (
          <Banner tone="amber">
            No contract address configured. Set{" "}
            <code className="font-mono">REACT_APP_CONTRACT_ADDRESS</code> in{" "}
            <code className="font-mono">frontend/.env.local</code> (after you deploy)
            and restart the dev server.
          </Banner>
        )}

        {/* Not connected */}
        {configured && !connected && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <div className="text-4xl">👋</div>
            <h2 className="mt-2 text-xl font-semibold">Connect your wallet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
              Connect a MetaMask wallet on the Sepolia testnet to detect your role
              and access the admin panel.
            </p>
            <div className="mt-4 inline-flex">
              <WalletConnect
                hasMetaMask={wallet.hasMetaMask}
                account={wallet.account}
                balance={wallet.balance}
                connecting={wallet.connecting}
                wrongNetwork={wallet.wrongNetwork}
                error={wallet.error}
                onConnect={wallet.connect}
                onDisconnect={wallet.disconnect}
                onSwitchNetwork={wallet.switchToSepolia}
              />
            </div>
            {CONTRACT_ADDRESS && (
              <p className="mt-4 text-xs text-slate-400">
                Contract:{" "}
                <a
                  href={addressUrl(CONTRACT_ADDRESS)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {CONTRACT_ADDRESS}
                </a>
              </p>
            )}
          </div>
        )}

        {/* Wrong network */}
        {configured && connected && !onChain && (
          <Banner tone="amber">
            You're connected to the wrong network. This app runs on{" "}
            <strong>Sepolia</strong> (chain ID 11155111).{" "}
            <button onClick={wallet.switchToSepolia} className="font-semibold underline">
              Switch network
            </button>
            .
          </Banner>
        )}

        {/* Connected + correct network -> dashboard */}
        {configured && connected && onChain && (
          <Dashboard
            role={role || "NONE"}
            writeContract={writeContract}
            onChange={() => {
              refreshRole();
              wallet.refreshBalance(wallet.account);
            }}
          />
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-400">
        Permission-tiered admin panel · Sepolia testnet · ethers v6
      </footer>
    </div>
  );
}

function Banner({ tone, children }) {
  const tones = {
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    red: "border-red-300 bg-red-50 text-red-800",
  };
  return (
    <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}
