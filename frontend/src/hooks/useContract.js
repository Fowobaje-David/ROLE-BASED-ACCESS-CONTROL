import { useEffect, useState } from "react";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import AdminPanelArtifact from "../abi/AdminPanel.json";
import { CONTRACT_ADDRESS, RPC_URL } from "../config";

// Provides two contract instances:
//  - readContract:  connected to a read-only provider (public views, role detection).
//  - writeContract: connected to the wallet signer (writes + onlyRole `view` reads
//                   like getAllUsers/getUserCount/getMyProfile, which need msg.sender).
export function useContract(account) {
  const [readContract, setReadContract] = useState(null);
  const [writeContract, setWriteContract] = useState(null);
  const [ready, setReady] = useState(false);

  const configured = !!CONTRACT_ADDRESS && CONTRACT_ADDRESS.startsWith("0x") &&
    CONTRACT_ADDRESS.length === 42;

  useEffect(() => {
    if (!configured) {
      setReadContract(null);
      setWriteContract(null);
      setReady(false);
      return;
    }

    // Read-only provider: prefer the injected wallet provider, fall back to RPC URL.
    let cancelled = false;
    async function setup() {
      try {
        let readProvider = null;
        if (window.ethereum) {
          readProvider = new BrowserProvider(window.ethereum);
        } else if (RPC_URL) {
          readProvider = new JsonRpcProvider(RPC_URL);
        }

        if (readProvider) {
          const rc = new Contract(
            CONTRACT_ADDRESS,
            AdminPanelArtifact.abi,
            readProvider
          );
          if (!cancelled) setReadContract(rc);
        }

        if (window.ethereum && account) {
          const browserProvider = new BrowserProvider(window.ethereum);
          const signer = await browserProvider.getSigner();
          const wc = new Contract(
            CONTRACT_ADDRESS,
            AdminPanelArtifact.abi,
            signer
          );
          if (!cancelled) setWriteContract(wc);
        } else if (!cancelled) {
          setWriteContract(null);
        }

        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setReady(false);
      }
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, [account, configured]);

  return { readContract, writeContract, ready, configured };
}
