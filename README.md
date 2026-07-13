# Permission-Tiered Admin Panel

A two-part project: an `AdminPanel` smart contract (Solidity 0.8.20, OpenZeppelin
AccessControl) plus a React + ethers v6 + Tailwind frontend that detects the
connected wallet's role and renders only the actions that role may perform — with
clear on-screen messaging explaining **why** any disabled action is unavailable.

- **Roles:** Owner, Moderator, Regular User, plus a no-role (`NONE`) state.
- **Network:** Sepolia testnet (chain ID `11155111`).
- **Stack:** Hardhat + `@nomicfoundation/hardhat-toolbox`, OpenZeppelin Contracts `^5`, ethers v6, React 18, Tailwind CSS.

> ⚠️ This repo is **deploy-ready, not deployed.** Nothing here deploys a contract
> or stores any private key. You deploy from your own wallet using the steps below.

---

## Repository layout

```
contracts/AdminPanel.sol          # the smart contract
test/AdminPanel.test.js           # full test suite (npx hardhat test)
scripts/deploy.js                 # deploy AdminPanel (you run it; passes deployer as initialOwner)
scripts/grantTestRoles.js         # owner-run helper to grant tester roles (re-run safe)
scripts/exportAbi.js              # copies compiled ABI -> frontend/src/abi
hardhat.config.js                 # reads SEPOLIA_RPC_URL / PRIVATE_KEY / ETHERSCAN_API_KEY
.env.example                      # copy to .env and fill in (git-ignored)
TESTING_HANDOFF.md                # fill-in-the-blanks doc for an independent tester
frontend/                         # React + ethers v6 + Tailwind app
  .env.local.example              # copy to .env.local and fill in
  src/abi/AdminPanel.json         # exported ABI (regenerate with npm run export-abi)
api/                              # REST API infrastructure over the contract (Express + ethers)
  README.md                       # API documentation + integration guide
  src/openapi.js                  # OpenAPI 3 spec -> interactive reference at /docs
```

This repo has three parts: the **smart contract** (Hardhat), the **frontend dApp**
(`frontend/`), and a **REST API** (`api/`) that lets other applications integrate
over HTTP without a wallet. See **[api/README.md](api/README.md)** for the API docs
and the hosted interactive reference (Swagger UI at `/docs`).

- **[API_INFRASTRUCTURE.md](API_INFRASTRUCTURE.md)** — architecture, hosting, stack,
  data layer, and security design of the API (the "how and where it runs" document).

---

## Human steps (in order)

### 1. Install dependencies

```bash
# repo root (Hardhat side)
npm install

# frontend
cd frontend && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `SEPOLIA_RPC_URL` — your Alchemy/Infura/public Sepolia RPC URL.
- `PRIVATE_KEY` — the **deployer/owner** wallet's private key (Sepolia testnet only).
- `ETHERSCAN_API_KEY` — needed for `npx hardhat verify`.

(`CONTRACT_ADDRESS`, `TEST_MODERATOR_ADDRESS`, `TEST_USER_ADDRESS` are filled in later, after deploy.)

> `.env` is git-ignored. **Never commit it.** Only `.env.example` (placeholders) is tracked.

### 3. Compile & run the tests

```bash
npx hardhat compile
npx hardhat test
```

All tests should pass (covers owner/moderator/user/no-role permissions, deactivation, reverts).

### 4. Deploy to Sepolia (you do this — not the build)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

This deploys `AdminPanel`, passing **your deployer address as `initialOwner`** (the
constructor grants the owner all three roles). The script prints the deployed address.
Copy it.

### 5. Verify on Etherscan

The constructor argument is **required** or verification fails:

```bash
npx hardhat verify --network sepolia <ADDRESS> "<INITIAL_OWNER_ADDRESS>"
```

`<INITIAL_OWNER_ADDRESS>` is your deployer address (same one shown by the deploy script).

### 6. Wire up the frontend

The ABI is already exported to `frontend/src/abi/AdminPanel.json`. If you ever change
the contract, regenerate it with `npm run export-abi` after compiling.

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
- `REACT_APP_CONTRACT_ADDRESS` — the address from step 4.
- `REACT_APP_CHAIN_ID=11155111` (already set).
- `REACT_APP_RPC_URL` — your Sepolia RPC URL (used for read-only role detection).

### 7. Run / build the frontend

```bash
# from frontend/
npm start          # dev server at http://localhost:3000
# or
npm run build      # production build in frontend/build/
```

### 8. Host it

Deploy `frontend/build/` (or connect the repo) to any static host — Vercel, Netlify,
GitHub Pages, etc. Set the same `REACT_APP_*` env vars in the host's settings.

### 9. Set up independent testing

After deploying, let a third party experience each role:

1. **Create disposable Sepolia test wallets yourself** (e.g. new MetaMask accounts) —
   one Moderator, one Regular User. These hold no real value. Fund each with a little
   Sepolia ETH from a faucet.
2. Put their **addresses** (not keys) into `.env`:
   `CONTRACT_ADDRESS`, `TEST_MODERATOR_ADDRESS`, `TEST_USER_ADDRESS`.
3. Grant the roles (re-run safe — skips roles already held):

   ```bash
   npx hardhat run scripts/grantTestRoles.js --network sepolia
   ```

   It promotes the moderator address and registers the user address, prints each tx's
   Etherscan link, and reads back `getUserRole(...)` to confirm.
4. Complete **[TESTING_HANDOFF.md](TESTING_HANDOFF.md)** — fill in the `<PLACEHOLDER>`
   fields (frontend URL, contract address, the test wallet addresses + their throwaway
   keys) and hand it to your tester. It contains a per-role verification script and an
   expected-results checklist.

---

## Notes

- **Reading guarded views in the frontend:** `getAllUsers`, `getUserCount`, and
  `getMyProfile` are `view` functions guarded by `onlyRole`, so the frontend calls them
  through a **signer-connected** contract instance (so `msg.sender` is your wallet).
  Role *detection* uses the public `getUserRole`, which works from a plain provider.
- **Security:** no private keys, seed phrases, or secrets are stored or committed
  anywhere in this repo. `.gitignore` covers `.env*` and `node_modules`. The test
  wallets are disposable testnet-only — never reuse them for mainnet.
