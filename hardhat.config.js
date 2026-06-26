require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = (process.env.SEPOLIA_RPC_URL || "").trim();
const ETHERSCAN_API_KEY = (process.env.ETHERSCAN_API_KEY || "").trim();

// Normalize the private key: trim whitespace and ensure the 0x prefix Hardhat
// requires, so it works whether or not the user added "0x" in .env.
function normalizePrivateKey(raw) {
  const k = (raw || "").trim();
  if (!k) return "";
  return k.startsWith("0x") ? k : "0x" + k;
}
const PRIVATE_KEY = normalizePrivateKey(process.env.PRIVATE_KEY);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local in-memory network used for `npx hardhat test`.
    hardhat: {},
    // Sepolia testnet — configured for deploy/verify but NEVER deployed here.
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
