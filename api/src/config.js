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

// Signed API keys (stateless HMAC). Secret used to sign/verify issued keys.
const API_KEY_SECRET = trim(process.env.API_KEY_SECRET);
// Secret that authorizes minting new keys via POST /api/v1/keys.
const ADMIN_SECRET = trim(process.env.ADMIN_SECRET);
// Comma-separated key ids to reject even if their signature is valid.
const REVOKED_KEYS = trim(process.env.REVOKED_KEYS)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// AI assistant (Google Gemini). Key stays server-side; never sent to the browser.
const GEMINI_API_KEY = trim(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = trim(process.env.GEMINI_MODEL) || "gemini-2.0-flash";

if (!RPC_URL) throw new Error("Missing RPC_URL in environment.");
if (!CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS in environment.");

// Some form of key auth must exist before writes are allowed (fail closed):
// either the legacy shared API_KEY, or the signed-key secret.
const hasKeyAuth = Boolean(API_KEY || API_KEY_SECRET);
const writeConfigured = Boolean(OPERATOR_PRIVATE_KEY && hasKeyAuth);

module.exports = {
  RPC_URL,
  CONTRACT_ADDRESS,
  CHAIN_ID,
  EXPLORER_BASE,
  PORT,
  OPERATOR_PRIVATE_KEY,
  API_KEY,
  API_KEY_SECRET,
  ADMIN_SECRET,
  REVOKED_KEYS,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  CORS_ORIGINS,
  writeConfigured,
  hasOperatorKey: Boolean(OPERATOR_PRIVATE_KEY),
  hasApiKey: hasKeyAuth,
  canIssueKeys: Boolean(API_KEY_SECRET && ADMIN_SECRET),
  assistantEnabled: Boolean(GEMINI_API_KEY),
  VERSION: require("../package.json").version,
};
