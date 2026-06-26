// Owner-run helper: grants tester roles so a third party can experience each tier
// without the owner clicking through the UI.
//
//   npx hardhat run scripts/grantTestRoles.js --network sepolia
//
// - Reads CONTRACT_ADDRESS, TEST_MODERATOR_ADDRESS, TEST_USER_ADDRESS from .env.
// - Connects as the deployer/owner (PRIVATE_KEY).
// - Grants MODERATOR_ROLE to the moderator address and REGULAR_USER_ROLE to the user address.
// - Re-run safe: skips a grant (with a notice) if the address already holds the role.
// - Does NOT deploy and does NOT fund wallets — funding test wallets with Sepolia ETH
//   is a manual human step (see TESTING_HANDOFF.md).
const hre = require("hardhat");

function requireEnv(name) {
  const v = process.env[name];
  if (!v || v.trim() === "" || v.startsWith("0xYour") || v.startsWith("your_")) {
    throw new Error(
      `Missing or placeholder env var: ${name}. Fill it in your .env before running.`
    );
  }
  return v.trim();
}

function assertAddress(name, value) {
  if (!hre.ethers.isAddress(value)) {
    throw new Error(`${name} is not a valid address: ${value}`);
  }
  return hre.ethers.getAddress(value); // checksum
}

async function main() {
  const contractAddress = assertAddress(
    "CONTRACT_ADDRESS",
    requireEnv("CONTRACT_ADDRESS")
  );
  const testModerator = assertAddress(
    "TEST_MODERATOR_ADDRESS",
    requireEnv("TEST_MODERATOR_ADDRESS")
  );
  const testUser = assertAddress(
    "TEST_USER_ADDRESS",
    requireEnv("TEST_USER_ADDRESS")
  );

  const [signer] = await hre.ethers.getSigners();
  if (!signer) {
    throw new Error(
      "No signer found. Set PRIVATE_KEY and SEPOLIA_RPC_URL in your .env."
    );
  }

  const adminPanel = await hre.ethers.getContractAt(
    "AdminPanel",
    contractAddress,
    signer
  );

  const OWNER_ROLE = await adminPanel.OWNER_ROLE();
  const MODERATOR_ROLE = await adminPanel.MODERATOR_ROLE();
  const REGULAR_USER_ROLE = await adminPanel.REGULAR_USER_ROLE();

  console.log("=".repeat(60));
  console.log("grantTestRoles");
  console.log("  Network :", hre.network.name);
  console.log("  Owner   :", signer.address);
  console.log("  Contract:", contractAddress);
  console.log("=".repeat(60));

  // Sanity check: signer must actually be an owner, or every grant reverts.
  const signerIsOwner = await adminPanel.hasRole(OWNER_ROLE, signer.address);
  if (!signerIsOwner) {
    throw new Error(
      `Connected signer ${signer.address} does NOT hold OWNER_ROLE on this contract. ` +
        "Use the deployer/owner wallet (PRIVATE_KEY) that deployed the contract."
    );
  }

  const txLink = (hash) => `https://sepolia.etherscan.io/tx/${hash}`;

  // --- Grant MODERATOR_ROLE ---
  console.log("\n[1/2] Moderator:", testModerator);
  if (await adminPanel.hasRole(MODERATOR_ROLE, testModerator)) {
    console.log("  ↪ already holds MODERATOR_ROLE — skipping promoteModerator.");
  } else {
    const tx = await adminPanel.promoteModerator(testModerator, "TestModerator");
    console.log("  tx sent:", tx.hash);
    console.log("  ", txLink(tx.hash));
    await tx.wait();
    console.log("  ✅ confirmed.");
  }

  // --- Grant REGULAR_USER_ROLE ---
  console.log("\n[2/2] Regular user:", testUser);
  if (await adminPanel.hasRole(REGULAR_USER_ROLE, testUser)) {
    console.log("  ↪ already holds REGULAR_USER_ROLE — skipping registerUser.");
  } else {
    const tx = await adminPanel.registerUser(testUser, "TestUser");
    console.log("  tx sent:", tx.hash);
    console.log("  ", txLink(tx.hash));
    await tx.wait();
    console.log("  ✅ confirmed.");
  }

  // --- Read back and confirm ---
  console.log("\nConfirming roles on-chain:");
  console.log("  Moderator role :", await adminPanel.getUserRole(testModerator));
  console.log("  Regular user   :", await adminPanel.getUserRole(testUser));
  console.log("\nDone. Hand the wallets + TESTING_HANDOFF.md to your tester.");
}

main().catch((error) => {
  console.error("\n❌ grantTestRoles failed:", error.message || error);
  process.exitCode = 1;
});
