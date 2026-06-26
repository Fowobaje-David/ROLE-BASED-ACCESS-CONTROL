import { useCallback, useEffect, useState } from "react";

// Detect the connected wallet's role via the public getUserRole(account) view.
// Returns "OWNER" | "MODERATOR" | "REGULAR_USER" | "NONE".
export function useRole(readContract, account) {
  const [role, setRole] = useState(null); // null = not yet known
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detect = useCallback(async () => {
    if (!readContract || !account) {
      setRole(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await readContract.getUserRole(account);
      setRole(r);
    } catch (e) {
      setError("Could not read role from contract.");
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [readContract, account]);

  useEffect(() => {
    detect();
  }, [detect]);

  return { role, loading, error, refresh: detect };
}
