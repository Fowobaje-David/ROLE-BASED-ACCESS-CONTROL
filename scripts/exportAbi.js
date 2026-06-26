// Copies the compiled ABI to frontend/src/abi/AdminPanel.json.
// Run after `npx hardhat compile` (or via `npm run export-abi`) if the contract changes.
const fs = require("fs");
const path = require("path");

const artifactPath = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "AdminPanel.sol",
  "AdminPanel.json"
);

if (!fs.existsSync(artifactPath)) {
  console.error("Artifact not found. Run `npx hardhat compile` first.");
  process.exit(1);
}

const artifact = require(artifactPath);
const out = { contractName: artifact.contractName, abi: artifact.abi };

const outDir = path.join(__dirname, "..", "frontend", "src", "abi");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "AdminPanel.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

console.log(`ABI exported to frontend/src/abi/AdminPanel.json (${out.abi.length} entries).`);
