// Central config + role metadata, read from CRA env (.env.local).

export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "";
export const CHAIN_ID = Number(process.env.REACT_APP_CHAIN_ID || 11155111);
export const RPC_URL = process.env.REACT_APP_RPC_URL || "";

export const CHAIN_ID_HEX = "0x" + CHAIN_ID.toString(16);
export const SEPOLIA_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: "Sepolia test network",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [RPC_URL || "https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export const ETHERSCAN_BASE = "https://sepolia.etherscan.io";
export const txUrl = (hash) => `${ETHERSCAN_BASE}/tx/${hash}`;
export const addressUrl = (addr) => `${ETHERSCAN_BASE}/address/${addr}`;

// Role hierarchy: index = power level. Higher index implies all lower abilities,
// which mirrors the on-chain contract (owner holds all three roles).
export const ROLES = {
  OWNER: {
    label: "OWNER",
    level: 3,
    badge: "bg-owner text-white",
    ring: "ring-owner",
    description: "Full control — user, role, and system management.",
  },
  MODERATOR: {
    label: "MODERATOR",
    level: 2,
    badge: "bg-moderator text-white",
    ring: "ring-moderator",
    description: "Moderation — activate/deactivate users, approve content.",
  },
  REGULAR_USER: {
    label: "REGULAR_USER",
    level: 1,
    badge: "bg-regular text-white",
    ring: "ring-regular",
    description: "Standard user — edit profile, submit feedback.",
  },
  NONE: {
    label: "NONE",
    level: 0,
    badge: "bg-none text-white",
    ring: "ring-none",
    description: "No assigned role — read-only, no gated actions.",
  },
};

// Minimum role required for each contract action, used to drive permission-aware UI.
export const REQUIRED_ROLE = {
  promoteModerator: "OWNER",
  registerUser: "OWNER",
  removeUser: "OWNER",
  updateSystemSetting: "OWNER",
  getAllUsers: "OWNER",
  deactivateUser: "MODERATOR",
  reactivateUser: "MODERATOR",
  approveUserContent: "MODERATOR",
  getUserCount: "MODERATOR",
  updateProfile: "REGULAR_USER",
  submitFeedback: "REGULAR_USER",
  getMyProfile: "REGULAR_USER",
};

// Does `role` satisfy the requirement for `requiredRole`? (level-based, owner = superset)
export function roleSatisfies(role, requiredRole) {
  const have = ROLES[role]?.level ?? 0;
  const need = ROLES[requiredRole]?.level ?? 99;
  return have >= need;
}
