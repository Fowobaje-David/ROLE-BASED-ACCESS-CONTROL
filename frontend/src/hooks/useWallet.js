import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { CHAIN_ID, CHAIN_ID_HEX, SEPOLIA_PARAMS } from "../config";

// Wallet connection: connect, account, chainId, balance, disconnect, network switch.
// Re-detects on accountsChanged / chainChanged.
export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [provider, setProvider] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const hasMetaMask = typeof window !== "undefined" && !!window.ethereum;
  const wrongNetwork = chainId !== null && chainId !== CHAIN_ID;

  const refreshBalance = useCallback(async (addr) => {
    if (!window.ethereum || !addr) return;
    try {
      const prov = new BrowserProvider(window.ethereum);
      const bal = await prov.getBalance(addr);
      setBalance(formatEther(bal));
    } catch {
      setBalance(null);
    }
  }, []);

  const syncState = useCallback(
    async (accounts) => {
      if (!window.ethereum) return;
      const prov = new BrowserProvider(window.ethereum);
      setProvider(prov);
      const net = await prov.getNetwork();
      setChainId(Number(net.chainId));

      const acct = accounts && accounts.length ? accounts[0] : null;
      setAccount(acct);
      if (acct) {
        await refreshBalance(acct);
      } else {
        setBalance(null);
      }
    },
    [refreshBalance]
  );

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("MetaMask not detected. Install it to connect a wallet.");
      return;
    }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      await syncState(accounts);
    } catch (err) {
      setError(err?.code === 4001 ? "Connection rejected." : "Failed to connect.");
    } finally {
      setConnecting(false);
    }
  }, [syncState]);

  const disconnect = useCallback(() => {
    // dApps can't force MetaMask to disconnect; clear local state.
    setAccount(null);
    setBalance(null);
    setError(null);
  }, []);

  // Force MetaMask to re-open its account picker so the user can pick/connect a
  // different account. Plain eth_requestAccounts won't prompt once a site is
  // already connected — wallet_requestPermissions does.
  const switchAccount = useCallback(async () => {
    if (!window.ethereum) return;
    setError(null);
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      await syncState(accounts);
    } catch (err) {
      if (err?.code !== 4001) setError("Could not switch account.");
    }
  }, [syncState]);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    setError(null);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID_HEX }],
      });
    } catch (err) {
      // 4902 = chain not added to wallet; add it then it becomes current.
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [SEPOLIA_PARAMS],
          });
        } catch {
          setError("Could not add the Sepolia network.");
        }
      } else if (err.code !== 4001) {
        setError("Could not switch network.");
      }
    }
  }, []);

  // Detect an already-authorized connection on mount + subscribe to events.
  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => syncState(accounts))
      .catch(() => {});

    const onAccounts = (accounts) => syncState(accounts);
    const onChain = () => {
      // Reload provider/state on chain change.
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => syncState(accounts))
        .catch(() => {});
    };

    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, [syncState]);

  return {
    hasMetaMask,
    account,
    chainId,
    balance,
    provider,
    connecting,
    error,
    wrongNetwork,
    connect,
    disconnect,
    switchAccount,
    switchToSepolia,
    refreshBalance,
  };
}
