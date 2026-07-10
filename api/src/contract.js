"use strict";
const { ethers } = require("ethers");
const config = require("./config");
const artifact = require("../abi/AdminPanel.json");

const provider = new ethers.JsonRpcProvider(config.RPC_URL, config.CHAIN_ID);

// Read-only contract (public views + role detection). No key needed.
const readContract = new ethers.Contract(
  config.CONTRACT_ADDRESS,
  artifact.abi,
  provider
);

// Operator (signer) contract for writes + role-gated views (getAllUsers, getUserCount).
let wallet = null;
let writeContract = null;
if (config.OPERATOR_PRIVATE_KEY) {
  wallet = new ethers.Wallet(config.OPERATOR_PRIVATE_KEY, provider);
  writeContract = new ethers.Contract(
    config.CONTRACT_ADDRESS,
    artifact.abi,
    wallet
  );
}

// Named role identifiers -> bytes32 (matches the contract's keccak256 constants).
const ROLE_IDS = {
  OWNER: ethers.id("OWNER_ROLE"),
  MODERATOR: ethers.id("MODERATOR_ROLE"),
  REGULAR_USER: ethers.id("REGULAR_USER_ROLE"),
};

const explorerTx = (hash) => `${config.EXPLORER_BASE}/tx/${hash}`;
const explorerAddress = (addr) => `${config.EXPLORER_BASE}/address/${addr}`;

module.exports = {
  provider,
  readContract,
  writeContract, // null when no operator key
  wallet,
  operatorAddress: wallet ? wallet.address : null,
  writeEnabled: config.writeConfigured,
  ROLE_IDS,
  explorerTx,
  explorerAddress,
};
