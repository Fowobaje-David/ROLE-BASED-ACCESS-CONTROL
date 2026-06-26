# Testing Handoff — Permission-Tiered Admin Panel

> **Fill in every `<PLACEHOLDER>` below after you deploy.** Do not share this file
> until the placeholders are completed. The private keys you paste here are for
> **disposable Sepolia testnet wallets only** — they hold no real value and must
> **never** be reused for mainnet or anything sensitive.

---

## 1. What this is

This is a **permission-tiered admin panel** built on an Ethereum smart contract
(Sepolia testnet). Access is split into three roles — **Owner**, **Moderator**,
and **Regular User** — plus a no-role state. As the tester, your job is to verify
that **each role sees and can do only what it is allowed to**, that disabled
actions clearly explain *why* they are locked, and that every write action lands
a real transaction on-chain.

---

## 2. Links

- **Live frontend URL:** `<FRONTEND_URL>`
- **Verified contract:** `https://sepolia.etherscan.io/address/0x18a5883dA6302e13021910235Cb74653b8804505#code`

---

## 3. Prerequisites

1. Install the **MetaMask** browser extension: https://metamask.io/download/
2. In MetaMask, switch the network to **Sepolia testnet** (chain ID `11155111`).
   (The app will also prompt you to switch if you're on the wrong network.)
3. Get a little **Sepolia ETH** to cover gas for the test transactions, from a faucet:
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - (alternatives: https://sepoliafaucet.com / https://faucet.quicknode.com/ethereum/sepolia)
   You only need a small amount (≈0.05 ETH) per wallet.

---

## 4. Test wallets

Import each wallet into MetaMask (MetaMask → account menu → *Import account* → paste the private key).
These are **throwaway testnet-only keys** — no real value, never reuse them anywhere sensitive.

| Role | Address | Private key (throwaway testnet only) |
|---|---|---|
| Owner | `<OWNER_ADDRESS>` | `<paste throwaway key here>` |
| Moderator | `<MODERATOR_ADDRESS>` | `<paste throwaway key here>` |
| Regular User | `<REGULAR_USER_ADDRESS>` | `<paste throwaway key here>` |

> **No-role test:** connect *any other* wallet (or a fresh MetaMask account) to see
> the locked-out state — role `NONE`, no dashboard actions available.

Each wallet needs a little Sepolia ETH (see Prerequisites) before it can send transactions.

---

## 5. How to verify each role

Follow these in order. After each write action, the app shows **pending → success**
with a **Sepolia Etherscan link** — click it to confirm the transaction is real.

### 5a. Owner
1. Import the **Owner** wallet and open the frontend.
2. Confirm the role badge says **OWNER** (purple).
3. **Register a user:** enter an address + username → *Register User* → tx succeeds.
4. **Promote a moderator:** enter an address + username → *Promote Moderator* → tx succeeds.
5. **Edit a system setting:** enter a key + value → *Update Setting* → tx succeeds.
6. Open each Etherscan link and confirm the transaction is mined.

### 5b. Moderator
1. Switch MetaMask to the **Moderator** wallet.
2. Confirm the badge says **MODERATOR** (orange).
3. **Deactivate / reactivate a user** and **approve content** → each tx succeeds.
4. Confirm the **owner-only** buttons (register user, promote moderator, remove user,
   system settings, all-users table) are **visibly disabled** and show a
   *"why" message* like `🔒 Requires OWNER role — your wallet is MODERATOR`.

### 5c. Regular User
1. Switch MetaMask to the **Regular User** wallet.
2. Confirm the badge says **REGULAR_USER** (blue).
3. **Edit profile** and **submit feedback** → each tx succeeds.
4. Confirm the **moderator-** and **owner-only** buttons are disabled with an
   explanation of the required role vs. your actual role.

### 5d. No-role wallet
1. Connect a **fresh wallet** with no assigned role.
2. Confirm the badge says **NONE** (gray) and the app shows the **locked-out state**
   with messaging — no gated actions can be performed.

---

## 6. How to independently verify it's real on-chain

You don't have to trust the UI — confirm directly on Etherscan:

1. Open the **verified contract source**:
   `https://sepolia.etherscan.io/address/0x18a5883dA6302e13021910235Cb74653b8804505#code`
   and read the `AdminPanel` source (the green checkmark means it's verified).
2. After running test transactions, open the contract's **"Events"** tab:
   `https://sepolia.etherscan.io/address/0x18a5883dA6302e13021910235Cb74653b8804505#events`
   and watch the `AuditLog` and `UserStatusChanged` events appear for each action
   you performed (e.g. `PROMOTE_MODERATOR`, `DEACTIVATE_USER`, `SUBMIT_FEEDBACK`).

---

## 7. Expected results checklist

Tick each box as you confirm it:

| Check | Owner | Moderator | Regular User | No-role |
|---|---|---|---|---|
| Correct role badge shown | ☐ | ☐ | ☐ | ☐ |
| Correct dashboard rendered | ☐ | ☐ | ☐ | ☐ |
| Allowed actions succeed (tx on Etherscan) | ☐ | ☐ | ☐ | n/a |
| Disabled actions explain *why + required role* | n/a | ☐ | ☐ | ☐ |
| `AuditLog` / `UserStatusChanged` events visible on Etherscan | ☐ | ☐ | ☐ | n/a |

**Overall pass criteria:** each role sees the right dashboard, every disabled action
explains why it's unavailable, and every write action lands a transaction on Etherscan.
