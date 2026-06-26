# BUILD SPEC — Permission-Tiered Admin Panel

**This document is the single source of truth for the build. Follow it exactly. Where this document and any other file disagree, this document wins.**

Deadline context: the working deliverable is due **Friday 8:00 AM**. Build for completeness and correctness over polish.

---

## 0. CRITICAL CONSTRAINTS (read first)

- **DO NOT deploy anything.** The human deploys the contract themselves, later, from their own wallet. Your job is to make everything deploy-*ready*.
- **DO NOT commit, hardcode, or print any private key, seed phrase, or mnemonic.** All secrets go in a `.env` file that is git-ignored. Provide a `.env.example` with placeholder values only.
- **DO NOT build the PowerPoint.** That is a later, separate task.
- Everything is **frontend + smart contract only**. No backend server, no database.
- Target network is **Sepolia testnet** (chain ID `11155111`), but never deploy — only configure for it.

---

## 1. WHAT TO BUILD

A two-part project in one repo:

1. A Hardhat project containing the `AdminPanel` smart contract (corrected version below), a full test suite, and a ready-to-run deploy + verify script.
2. A React frontend that connects a wallet, detects the connected wallet's role from the contract, and renders only the actions that role is permitted to perform — with **clear on-screen messaging explaining why a disabled action is unavailable** (this messaging is a graded requirement, not optional).

---

## 2. TECH STACK (pin to these)

| Layer | Choice |
|---|---|
| Contract language | Solidity `0.8.20` |
| Libraries | OpenZeppelin Contracts `^5.x` (AccessControl) |
| Dev environment | Hardhat + `@nomicfoundation/hardhat-toolbox` |
| Web3 library | **ethers.js v6 only** (do NOT also add wagmi/viem — one stack, keep it simple) |
| Frontend | React 18 |
| Styling | Tailwind CSS |
| Wallet | MetaMask / any EIP-1193 provider |

---

## 3. THE SMART CONTRACT (use this EXACT corrected version)

This is the provided contract with **one critical fix**: the constructor now grants the owner all three roles, so the owner genuinely passes every `onlyRole` check. Without this, the owner cannot call moderator/user functions and they revert on-chain — which breaks the "owner has full control" requirement and fails third-party testing. Save this to `contracts/AdminPanel.sol`.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AdminPanel
 * @dev Permission-tiered admin panel with three roles: Owner, Moderator, Regular User.
 *      The owner is granted all three roles so it can perform every gated action.
 */
contract AdminPanel is AccessControl {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant REGULAR_USER_ROLE = keccak256("REGULAR_USER_ROLE");

    struct User {
        address userAddress;
        string username;
        bool isActive;
        uint256 joinDate;
    }

    struct SystemSetting {
        string key;
        string value;
        uint256 lastModified;
    }

    mapping(address => User) public users;
    mapping(string => SystemSetting) public settings;
    address[] public userList;

    event UserAdded(address indexed user, string username, uint256 timestamp);
    event UserRemoved(address indexed user, uint256 timestamp);
    event UserRoleChanged(address indexed user, bytes32 indexed role, uint256 timestamp);
    event SettingChanged(string indexed key, string newValue, uint256 timestamp);
    event UserStatusChanged(address indexed user, bool isActive, uint256 timestamp);
    event AuditLog(string action, address indexed actor, string details, uint256 timestamp);

    modifier userExists(address _user) {
        require(users[_user].userAddress != address(0), "User does not exist");
        _;
    }

    constructor(address initialOwner) {
        // Owner gets DEFAULT_ADMIN_ROLE (can manage roles) plus all three tiers
        // so the owner can perform every gated action in the app.
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(OWNER_ROLE, initialOwner);
        _grantRole(MODERATOR_ROLE, initialOwner);
        _grantRole(REGULAR_USER_ROLE, initialOwner);

        users[initialOwner] = User({
            userAddress: initialOwner,
            username: "Owner",
            isActive: true,
            joinDate: block.timestamp
        });
        userList.push(initialOwner);

        emit UserAdded(initialOwner, "Owner", block.timestamp);
    }

    // ============ OWNER FUNCTIONS ============

    function promoteModerator(address account, string memory username)
        external
        onlyRole(OWNER_ROLE)
    {
        require(account != address(0), "Invalid address");
        require(bytes(username).length > 0, "Username cannot be empty");

        _grantRole(MODERATOR_ROLE, account);

        if (users[account].userAddress == address(0)) {
            users[account] = User({
                userAddress: account,
                username: username,
                isActive: true,
                joinDate: block.timestamp
            });
            userList.push(account);
            emit UserAdded(account, username, block.timestamp);
        }

        emit UserRoleChanged(account, MODERATOR_ROLE, block.timestamp);
        emit AuditLog("PROMOTE_MODERATOR", msg.sender, username, block.timestamp);
    }

    function registerUser(address account, string memory username)
        external
        onlyRole(OWNER_ROLE)
    {
        require(account != address(0), "Invalid address");
        require(bytes(username).length > 0, "Username cannot be empty");

        _grantRole(REGULAR_USER_ROLE, account);

        if (users[account].userAddress == address(0)) {
            users[account] = User({
                userAddress: account,
                username: username,
                isActive: true,
                joinDate: block.timestamp
            });
            userList.push(account);
            emit UserAdded(account, username, block.timestamp);
        }

        emit UserRoleChanged(account, REGULAR_USER_ROLE, block.timestamp);
        emit AuditLog("REGISTER_USER", msg.sender, username, block.timestamp);
    }

    function removeUser(address account)
        external
        onlyRole(OWNER_ROLE)
        userExists(account)
    {
        require(account != msg.sender, "Cannot remove yourself");

        users[account].isActive = false;
        _revokeRole(MODERATOR_ROLE, account);
        _revokeRole(REGULAR_USER_ROLE, account);

        emit UserRemoved(account, block.timestamp);
        emit UserStatusChanged(account, false, block.timestamp);
        emit AuditLog("REMOVE_USER", msg.sender, users[account].username, block.timestamp);
    }

    function updateSystemSetting(string memory key, string memory value)
        external
        onlyRole(OWNER_ROLE)
    {
        require(bytes(key).length > 0, "Key cannot be empty");

        settings[key] = SystemSetting({
            key: key,
            value: value,
            lastModified: block.timestamp
        });

        emit SettingChanged(key, value, block.timestamp);
        emit AuditLog("UPDATE_SETTING", msg.sender, key, block.timestamp);
    }

    function getAllUsers()
        external
        view
        onlyRole(OWNER_ROLE)
        returns (User[] memory)
    {
        User[] memory allUsers = new User[](userList.length);
        for (uint256 i = 0; i < userList.length; i++) {
            allUsers[i] = users[userList[i]];
        }
        return allUsers;
    }

    // ============ MODERATOR FUNCTIONS ============

    function deactivateUser(address account)
        external
        onlyRole(MODERATOR_ROLE)
        userExists(account)
    {
        require(account != msg.sender, "Cannot deactivate yourself");
        require(hasRole(OWNER_ROLE, account) == false, "Cannot deactivate owner");

        users[account].isActive = false;

        emit UserStatusChanged(account, false, block.timestamp);
        emit AuditLog("DEACTIVATE_USER", msg.sender, users[account].username, block.timestamp);
    }

    function reactivateUser(address account)
        external
        onlyRole(MODERATOR_ROLE)
        userExists(account)
    {
        users[account].isActive = true;

        emit UserStatusChanged(account, true, block.timestamp);
        emit AuditLog("REACTIVATE_USER", msg.sender, users[account].username, block.timestamp);
    }

    function approveUserContent(address account, string memory contentId)
        external
        onlyRole(MODERATOR_ROLE)
    {
        emit AuditLog("APPROVE_CONTENT", msg.sender, contentId, block.timestamp);
    }

    function getUserCount()
        external
        view
        onlyRole(MODERATOR_ROLE)
        returns (uint256)
    {
        return userList.length;
    }

    // ============ REGULAR USER FUNCTIONS ============

    function submitFeedback(string memory feedback)
        external
        onlyRole(REGULAR_USER_ROLE)
    {
        require(bytes(feedback).length > 0, "Feedback cannot be empty");
        require(users[msg.sender].isActive, "Account is deactivated");

        emit AuditLog("SUBMIT_FEEDBACK", msg.sender, feedback, block.timestamp);
    }

    function updateProfile(string memory newUsername)
        external
        onlyRole(REGULAR_USER_ROLE)
        userExists(msg.sender)
    {
        require(bytes(newUsername).length > 0, "Username cannot be empty");
        require(users[msg.sender].isActive, "Account is deactivated");

        users[msg.sender].username = newUsername;

        emit AuditLog("UPDATE_PROFILE", msg.sender, newUsername, block.timestamp);
    }

    function getMyProfile()
        external
        view
        onlyRole(REGULAR_USER_ROLE)
        returns (User memory)
    {
        return users[msg.sender];
    }

    // ============ PUBLIC VIEW FUNCTIONS (anyone) ============

    function hasUserRole(address account, string memory roleName)
        external
        view
        returns (bool)
    {
        if (keccak256(abi.encodePacked(roleName)) == keccak256(abi.encodePacked("OWNER"))) {
            return hasRole(OWNER_ROLE, account);
        } else if (keccak256(abi.encodePacked(roleName)) == keccak256(abi.encodePacked("MODERATOR"))) {
            return hasRole(MODERATOR_ROLE, account);
        } else if (keccak256(abi.encodePacked(roleName)) == keccak256(abi.encodePacked("REGULAR_USER"))) {
            return hasRole(REGULAR_USER_ROLE, account);
        }
        return false;
    }

    function getUserRole(address account)
        external
        view
        returns (string memory)
    {
        if (hasRole(OWNER_ROLE, account)) {
            return "OWNER";
        } else if (hasRole(MODERATOR_ROLE, account)) {
            return "MODERATOR";
        } else if (hasRole(REGULAR_USER_ROLE, account)) {
            return "REGULAR_USER";
        }
        return "NONE";
    }

    function getSystemSetting(string memory key)
        external
        view
        returns (string memory)
    {
        return settings[key].value;
    }

    function isUserActive(address account)
        external
        view
        returns (bool)
    {
        return users[account].isActive;
    }
}
```

**Note on reading data in the frontend:** `getAllUsers`, `getUserCount`, and `getMyProfile` are `view` functions guarded by `onlyRole`. They only succeed when the call carries a `from` address. So the frontend MUST call these through a contract instance connected to the **signer** (not a bare provider), so `msg.sender` resolves to the connected wallet. Role *detection* uses `getUserRole`, which is public and works from a provider.

---

## 4. HARDHAT PROJECT REQUIREMENTS

- Standard Hardhat layout: `contracts/`, `test/`, `scripts/`, `hardhat.config.js`.
- `hardhat.config.js` must read `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, and `ETHERSCAN_API_KEY` from `.env` (via `dotenv`). Define a `sepolia` network using these. **Never inline real values.**
- Provide `scripts/deploy.js` that deploys `AdminPanel`, passing the deployer address as `initialOwner`, and prints the deployed address. The human will run it; you do not.
- Provide a verify command in the README: `npx hardhat verify --network sepolia <ADDRESS> "<INITIAL_OWNER_ADDRESS>"` (the constructor arg is required or verification fails).
- After compile, export the ABI to `frontend/src/abi/AdminPanel.json` so the frontend can import it.

### Test suite (`test/AdminPanel.test.js`) — must cover:
- Deployer is OWNER, MODERATOR, and REGULAR_USER, and `getUserRole(owner) == "OWNER"`.
- Owner can `promoteModerator`, `registerUser`, `updateSystemSetting`, `removeUser`, `getAllUsers`.
- A moderator account can `deactivateUser` / `reactivateUser` but **reverts** on owner-only functions.
- A regular user can `updateProfile` / `submitFeedback` but **reverts** on moderator- and owner-only functions.
- An address with no role **reverts** on every gated function.
- Deactivated user **reverts** on `submitFeedback` / `updateProfile`.
All tests must pass with `npx hardhat test`.

---

## 5. FRONTEND REQUIREMENTS

### Structure
```
frontend/src/
  abi/AdminPanel.json
  hooks/useWallet.js      // connect, account, chainId, disconnect, network-switch prompt
  hooks/useContract.js    // ethers Contract instances (provider + signer)
  hooks/useRole.js        // calls getUserRole(account) -> "OWNER"|"MODERATOR"|"REGULAR_USER"|"NONE"
  components/WalletConnect.jsx
  components/RoleBadge.jsx
  components/Dashboard.jsx        // routes to the right dashboard by role
  components/OwnerDashboard.jsx
  components/ModeratorDashboard.jsx
  components/UserDashboard.jsx
  components/ActionButton.jsx     // shared permission-aware button (see below)
  components/TxStatus.jsx         // loading / success / error feedback
  App.jsx
```

### Behavior
1. **Connect wallet** (MetaMask). Show address + ETH balance. Prompt to switch to Sepolia if `chainId !== 11155111`. Re-detect on `accountsChanged` / `chainChanged`.
2. **Detect role** via `getUserRole(account)`. Show a color-coded badge: OWNER = purple, MODERATOR = orange, REGULAR_USER = blue, NONE = gray.
3. **Render the matching dashboard** (section 6). Show every action the wallet *could* see for its tier.
4. **Permission-aware buttons** — the key UX requirement:
   - If the wallet may perform the action → normal, enabled button.
   - If not → render the button **visibly disabled** (greyed) with an inline message / tooltip stating the required role and the wallet's actual role, e.g. `🔒 Requires MODERATOR role — your wallet is REGULAR_USER`. Never silently hide; always explain.
5. **Transaction feedback** — every write action shows pending → success (with a Sepolia Etherscan tx link) → or a human-readable error (parse revert reasons; don't dump raw hex).
6. **Mobile responsive** via Tailwind.

### Config
- Read from `.env.local`: `REACT_APP_CONTRACT_ADDRESS`, `REACT_APP_CHAIN_ID=11155111`, `REACT_APP_RPC_URL`. Provide `.env.local.example` with placeholders. The human fills in the real contract address after they deploy.

---

## 6. DASHBOARDS & PERMISSION MATRIX

Build all three. The corrected contract makes the owner a superset, so the matrix below is now true on-chain.

| Function | Owner | Moderator | Regular User | Public |
|---|---|---|---|---|
| promoteModerator | ✅ | ❌ | ❌ | ❌ |
| registerUser | ✅ | ❌ | ❌ | ❌ |
| removeUser | ✅ | ❌ | ❌ | ❌ |
| updateSystemSetting | ✅ | ❌ | ❌ | ❌ |
| getAllUsers | ✅ | ❌ | ❌ | ❌ |
| deactivateUser | ✅ | ✅ | ❌ | ❌ |
| reactivateUser | ✅ | ✅ | ❌ | ❌ |
| approveUserContent | ✅ | ✅ | ❌ | ❌ |
| getUserCount | ✅ | ✅ | ❌ | ❌ |
| updateProfile | ✅ | ✅ | ✅ | ❌ |
| submitFeedback | ✅ | ✅ | ✅ | ❌ |
| getMyProfile | ✅ | ✅ | ✅ | ❌ |
| getUserRole / getSystemSetting / isUserActive | ✅ | ✅ | ✅ | ✅ |

- **OwnerDashboard:** user management (register/remove), role management (promote moderator), system settings editor, all-users table, plus the moderator and user sections.
- **ModeratorDashboard:** activate/deactivate users, approve content, user count/stats, plus the user section.
- **UserDashboard:** edit profile, submit feedback, view own info.

---

## 7. TEST WALLETS & INDEPENDENT-TESTING HANDOFF

The brief requires that a **third party can test the system independently**. A fresh wallet that connects will have role `NONE` and can only see the no-role state — so without setup, an outside tester cannot experience the Owner / Moderator / Regular-User tiers. This section closes that gap. Build both artifacts below.

> Security note for the generated artifacts: the test wallets are **disposable Sepolia testnet wallets only**. The handoff doc and helper script must state clearly that these keys are throwaway, hold no real value, and must never be reused for mainnet or anything sensitive. Do NOT generate, hardcode, or commit any real private keys. The human will create the test wallets and paste their addresses into config; the script only *grants roles to* addresses, it never stores their keys.

### 7a. Helper script — `scripts/grantTestRoles.js`
A Hardhat script the **owner** runs after deployment to assign roles to tester addresses, so the human does not have to click through the UI to set up testing.

- Reads three values from `.env`: `CONTRACT_ADDRESS`, `TEST_MODERATOR_ADDRESS`, `TEST_USER_ADDRESS` (add these to `.env.example` as placeholders).
- Connects as the deployer/owner signer (same `PRIVATE_KEY` pattern as the deploy script).
- Calls `promoteModerator(TEST_MODERATOR_ADDRESS, "TestModerator")` and `registerUser(TEST_USER_ADDRESS, "TestUser")`.
- After each call, logs the tx hash and a `https://sepolia.etherscan.io/tx/<hash>` link, then reads back and prints `getUserRole(...)` for both addresses to confirm.
- Skips a grant gracefully (with a printed notice) if an address already holds the role, so the script is safe to re-run.
- **Does not deploy and does not fund wallets** — it only grants roles. Funding test wallets with Sepolia ETH is a manual human step, noted in the handoff doc.
- The human runs it with: `npx hardhat run scripts/grantTestRoles.js --network sepolia`.

### 7b. Handoff document — `TESTING_HANDOFF.md` (template, generated at repo root)
A short, fill-in-the-blanks document the human completes after deploying and hands to the tester. Generate it with clearly marked `<PLACEHOLDER>` fields (do not invent values). It must contain:

1. **What this is** — one paragraph: a permission-tiered admin panel; the tester will verify that each role sees and can do only what it's allowed.
2. **Links** — `Live frontend URL: <FRONTEND_URL>` and `Verified contract: https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>#code`.
3. **Prerequisites** — install MetaMask, switch network to Sepolia, get a little Sepolia ETH from a faucet (include a faucet link) to cover gas.
4. **Test wallets table** — three rows (Owner / Moderator / Regular User) with columns: Role, Address `<...>`, Private key `<paste throwaway key here>`, and a note that these are disposable testnet-only keys. Plus a line for "No-role test: connect any other wallet to see the locked-out state."
5. **How to verify each role** — a numbered, copy-pasteable script the tester follows:
   - Import the Owner wallet → confirm badge says OWNER → register a user, promote a moderator, edit a system setting → confirm each tx succeeds and appears on Etherscan.
   - Switch to the Moderator wallet → confirm badge says MODERATOR → deactivate/reactivate a user, approve content succeed; confirm owner-only buttons are **visibly disabled with a "why" message**.
   - Switch to the Regular-User wallet → confirm badge says REGULAR_USER → edit profile and submit feedback succeed; confirm moderator/owner buttons are disabled with explanations.
   - Connect a fresh no-role wallet → confirm it sees the locked-out state with messaging and cannot perform gated actions.
6. **How to independently verify it's real onchain** — read the verified source on Etherscan, and watch the `AuditLog` / `UserStatusChanged` events appear on the contract's Etherscan "Events" tab after each test transaction.
7. **Expected results checklist** — a short table the tester can tick: each role sees the right dashboard, disabled actions explain why, every write action lands a tx on Etherscan.

Both artifacts must be referenced from the root `README.md` so the human sees them in their deploy flow.

---

## 8. DELIVERABLES & DEFINITION OF DONE

- [ ] Hardhat project compiles cleanly.
- [ ] `npx hardhat test` passes, covering all cases in section 4.
- [ ] `scripts/deploy.js` and the verify command exist and are documented (NOT executed).
- [ ] ABI exported to `frontend/src/abi/AdminPanel.json`.
- [ ] React app builds (`npm run build`) with no errors.
- [ ] Wallet connect + Sepolia network check work.
- [ ] Role detection works for all four states (Owner / Moderator / Regular / None).
- [ ] All three dashboards render correctly per role.
- [ ] Disabled actions show a clear "why + required role" message.
- [ ] Transaction states (pending/success/error) display, with Etherscan links.
- [ ] Mobile responsive.
- [ ] `.env.example` / `.env.local.example` provided; **no real secrets anywhere**; `.gitignore` covers `.env*` and `node_modules`.
- [ ] `scripts/grantTestRoles.js` exists, is re-run-safe, grants moderator/user roles from `.env` addresses, prints Etherscan links, and is documented (NOT executed).
- [ ] `TESTING_HANDOFF.md` template generated at repo root with `<PLACEHOLDER>` fields and the per-role verification script (section 7b).
- [ ] `.env.example` includes `TEST_MODERATOR_ADDRESS` and `TEST_USER_ADDRESS` placeholders.
- [ ] Root `README.md` with exact human steps: install, run tests, deploy to Sepolia, verify, fill frontend env, run frontend, host, **then run grantTestRoles and complete TESTING_HANDOFF.md**.
- [ ] **PowerPoint NOT built. Contract NOT deployed. Test wallets NOT generated by you (human creates them).**
