"use strict";
// Entry point for standalone hosting (Render, Railway, Fly, a VPS, or local).
const { buildApp } = require("./src/app");
const config = require("./src/config");

const app = buildApp();

app.listen(config.PORT, () => {
  console.log(`AdminPanel API listening on :${config.PORT}`);
  console.log(`  Docs:     http://localhost:${config.PORT}/docs`);
  console.log(`  Contract: ${config.CONTRACT_ADDRESS} (chain ${config.CHAIN_ID})`);
  console.log(`  Writes:   ${config.writeConfigured ? "ENABLED (operator + API key set)" : "read-only"}`);
});
