#!/usr/bin/env node
"use strict";
/**
 * Mint an API key from the command line.
 *
 *   npm run key:issue -- --name "Supervisor" --scope read  --days 30
 *   npm run key:issue -- --name "Partner"    --scope write --days 7
 *
 * Requires API_KEY_SECRET in the environment (.env). The key is printed once;
 * nothing is stored — it is verified by recomputing its HMAC signature.
 */
require("dotenv").config();
const { mintKey, describe } = require("../src/apikeys");

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const name = arg("--name", "");
const scope = arg("--scope", "read");
const days = Number(arg("--days", "30"));

if (!name) {
  console.error('Missing --name. Example:\n  npm run key:issue -- --name "Supervisor" --scope read --days 30');
  process.exit(1);
}

try {
  const { key, payload } = mintKey({ name, scope, days });
  const info = describe(payload);
  console.log("");
  console.log("  API key issued");
  console.log("  " + "-".repeat(58));
  console.log("  name    :", info.name);
  console.log("  scope   :", info.scope, scope === "read"
    ? "(admin reads — no gas, cannot change on-chain state)"
    : "(on-chain writes — spends operator gas)");
  console.log("  expires :", info.expiresAt || "never");
  console.log("  key id  :", info.id, "(add to REVOKED_KEYS to revoke)");
  console.log("");
  console.log("  " + key);
  console.log("");
  console.log("  Send it as:  x-api-key: <key>");
  console.log("  This is shown once — the server stores nothing.");
  console.log("");
} catch (e) {
  console.error("Failed to issue key:", e.message);
  console.error("Set API_KEY_SECRET in your .env first (a long random string).");
  process.exit(1);
}
