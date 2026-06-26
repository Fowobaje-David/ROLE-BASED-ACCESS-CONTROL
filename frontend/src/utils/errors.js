// Turn an ethers v6 error into a short, human-readable string.
// Never dump raw hex — parse revert reasons and common wallet errors.
export function parseError(err) {
  if (!err) return "Unknown error.";

  // User rejected the request in their wallet (EIP-1193 code 4001 / ethers ACTION_REJECTED).
  if (
    err.code === 4001 ||
    err.code === "ACTION_REJECTED" ||
    err.info?.error?.code === 4001
  ) {
    return "Transaction rejected in wallet.";
  }

  // Custom Solidity revert (e.g. AccessControlUnauthorizedAccount).
  if (err.code === "CALL_EXCEPTION") {
    if (err.reason) return err.reason;
    const name = err.revert?.name || err.errorName;
    if (name === "AccessControlUnauthorizedAccount") {
      return "Your wallet does not hold the role required for this action.";
    }
    if (name) return `Reverted: ${name}`;
  }

  // require(...) string reasons surface on .reason or .shortMessage.
  if (err.reason) return err.reason;

  // Insufficient funds for gas.
  if (err.code === "INSUFFICIENT_FUNDS") {
    return "Insufficient Sepolia ETH to cover gas. Get some from a faucet.";
  }

  // Dig for a nested require string in common ethers/provider shapes.
  const nested =
    err.error?.message || err.info?.error?.message || err.data?.message;
  if (nested) {
    const m = /reverted with reason string ['"](.+?)['"]/.exec(nested);
    if (m) return m[1];
    const m2 = /execution reverted:?\s*(.+)/i.exec(nested);
    if (m2 && !m2[1].startsWith("0x")) return m2[1].trim();
  }

  if (err.shortMessage) return err.shortMessage;
  if (typeof err.message === "string") {
    // Avoid returning a giant blob with hex data.
    return err.message.split("(")[0].trim().slice(0, 200);
  }
  return "Transaction failed.";
}
