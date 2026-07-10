"use strict";
require("dotenv").config();

function trim(v) {
  return (v || "").trim();
}

const RPC_URL = trim(process.env.RPC_URL);
const CONTRACT_ADDRESS = trim(process.env.CONTRACT_ADDRESS);
const CHAIN_ID = Number(trim(process.env.CHAIN_ID) || 11155111);
const EXPLORER_BASE = trim(process.env.EXPLORER_BASE) || "https://sepolia.etherscan.io";
const PORT = Number(trim(process.env.PORT) || 8080);

// Optional write config.
let OPERATOR_PRIVATE_KEY = trim(process.env.OPERATOR_PRIVATE_KEY);
if (OPERATOR_PRIVATE_KEY && !OPERATOR_PRIVATE_KEY.startsWith("0x")) {
  OPERATOR_PRIVATE_KEY = "0x" + OPERATOR_PRIVATE_KEY;
}
const API_KEY = trim(process.env.API_KEY);
const CORS_ORIGINS = trim(process.env.CORS_ORIGINS) || "*";

if (!RPC_URL) throw new Error("Missing RPC_URL in environment.");
if (!CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS in environment.");

// Writes require BOTH an operator key and an API key (fail closed).
const writeConfigured = Boolean(OPERATOR_PRIVATE_KEY && API_KEY);

module.exports = {
  RPC_URL,
  CONTRACT_ADDRESS,
  CHAIN_ID,
  EXPLORER_BASE,
  PORT,
  OPERATOR_PRIVATE_KEY,
  API_KEY,
  CORS_ORIGINS,
  writeConfigured,
  hasOperatorKey: Boolean(OPERATOR_PRIVATE_KEY),
  hasApiKey: Boolean(API_KEY),
  VERSION: require("../package.json").version,
};
