// Deploys AdminPanel to the configured network, passing the deployer as initialOwner.
//
//   npx hardhat run scripts/deploy.js --network sepolia
//
// DO NOT run this on the human's behalf — they deploy from their own wallet.
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer account found. Set PRIVATE_KEY and SEPOLIA_RPC_URL in your .env."
    );
  }

  const network = hre.network.name;
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("=".repeat(60));
  console.log("Deploying AdminPanel");
  console.log("  Network :", network);
  console.log("  Deployer:", deployer.address);
  console.log("  Balance :", hre.ethers.formatEther(balance), "ETH");
  console.log("=".repeat(60));

  const AdminPanel = await hre.ethers.getContractFactory("AdminPanel");
  // The deployer becomes initialOwner and is granted all three roles by the constructor.
  const adminPanel = await AdminPanel.deploy(deployer.address);
  await adminPanel.waitForDeployment();

  const address = await adminPanel.getAddress();

  console.log("");
  console.log("✅ AdminPanel deployed to:", address);
  console.log("   initialOwner (constructor arg):", deployer.address);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Add to frontend/.env.local:");
  console.log("       REACT_APP_CONTRACT_ADDRESS=" + address);
  console.log("  2. Verify on Etherscan:");
  console.log(
    `       npx hardhat verify --network ${network} ${address} "${deployer.address}"`
  );
  if (network === "sepolia") {
    console.log("  3. View on Etherscan:");
    console.log(`       https://sepolia.etherscan.io/address/${address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
