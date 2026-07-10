"use strict";
const { explorerTx } = require("./contract");

// Execute a contract write, wait for 1 confirmation, and format a clean response.
async function sendTx(call, meta = {}) {
  const tx = await call();
  const receipt = await tx.wait();
  return {
    success: receipt.status === 1,
    txHash: tx.hash,
    status: receipt.status === 1 ? "confirmed" : "failed",
    blockNumber: receipt.blockNumber,
    explorerUrl: explorerTx(tx.hash),
    ...meta,
  };
}

// Normalize the on-chain User struct into a JSON-friendly object.
function formatUser(u) {
  return {
    address: u.userAddress,
    username: u.username,
    isActive: u.isActive,
    joinDate: Number(u.joinDate),
    joinDateISO: u.joinDate ? new Date(Number(u.joinDate) * 1000).toISOString() : null,
  };
}

module.exports = { sendTx, formatUser };
