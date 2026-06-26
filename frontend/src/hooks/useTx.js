import { useCallback, useState } from "react";
import { parseError } from "../utils/errors";

// Manages a single write transaction's lifecycle: idle -> pending -> success | error.
// `run(fn)` expects fn() to return an ethers ContractTransactionResponse.
export function useTx() {
  const [status, setStatus] = useState("idle"); // idle | pending | success | error
  const [txHash, setTxHash] = useState(null);
  const [message, setMessage] = useState(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setMessage(null);
  }, []);

  const run = useCallback(async (fn, successMessage) => {
    setStatus("pending");
    setTxHash(null);
    setMessage(null);
    try {
      const tx = await fn();
      setTxHash(tx.hash);
      await tx.wait();
      setStatus("success");
      setMessage(successMessage || "Transaction confirmed.");
      return true;
    } catch (err) {
      setStatus("error");
      setMessage(parseError(err));
      return false;
    }
  }, []);

  return { status, txHash, message, run, reset };
}
