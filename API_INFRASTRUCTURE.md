# API Infrastructure — AdminPanel

**Technical architecture, hosting, and security design of the AdminPanel REST API.**

> This document describes *how and where the system runs*. For *what the endpoints do*,
> see the [API documentation](https://role-based-access-control-otuj.onrender.com/) and the
> [interactive reference](https://role-based-access-control-otuj.onrender.com/docs/).

---

## 1. Quick reference

| Layer | Technology |
|---|---|
| **Hosting / Cloud** | **Render** — Web Service (Node runtime), auto-deploy from GitHub `main` |
| **Backend framework** | **Node.js 18+ / Express 4** (CommonJS) |
| **Database** | **None — by design.** The smart contract's on-chain storage is the system of record (see §4) |
| **Blockchain layer** | **Ethereum Sepolia** (chain ID `11155111`) via **ethers.js v6** → **Alchemy** JSON-RPC |
| **Smart contract** | `AdminPanel.sol` (Solidity 0.8.20, OpenZeppelin **AccessControl**) — [verified on Etherscan](https://sepolia.etherscan.io/address/0x18a5883dA6302e13021910235Cb74653b8804505#code) |
| **Authentication** | **API key** (`x-api-key` header) for writes/admin reads; **role enforcement is on-chain**, not in the API |
| **API contract** | **REST**, versioned `/api/v1`, described by an **OpenAPI 3** spec → Swagger UI |
| **Security** | Helmet headers, CORS policy, input validation, rate limiting, fail-closed write gating, env-only secrets |
| **Source of truth** | GitHub — [ROLE-BASED-ACCESS-CONTROL](https://github.com/Fowobaje-David/ROLE-BASED-ACCESS-CONTROL) (`api/`) |

**Live endpoints**

| Service | URL |
|---|---|
| API + documentation | `https://role-based-access-control-otuj.onrender.com` |
| Interactive reference | `https://role-based-access-control-otuj.onrender.com/docs/` |
| Health check | `https://role-based-access-control-otuj.onrender.com/health` |
| Frontend dApp (separate) | `https://role-based-access-control-seven-taupe.vercel.app/` |
| Smart contract | `0x18a5883dA6302e13021910235Cb74653b8804505` (Sepolia) |

---

## 2. Architecture

```
   ┌──────────────────┐
   │  Client / dApp   │  any app, script, or service
   │  (curl, JS, py)  │
   └────────┬─────────┘
            │  HTTPS  (REST, JSON, /api/v1)
            │  x-api-key on writes
            ▼
 ┌───────────────────────────────────────────────┐
 │        RENDER — Web Service (Node 18)          │
 │  ┌─────────────────────────────────────────┐  │
 │  │  Express application                     │  │
 │  │  ├─ Middleware: Helmet · CORS ·          │  │
 │  │  │   rate-limit · JSON parser · logging  │  │
 │  │  ├─ Auth guard: x-api-key (writes)       │  │
 │  │  ├─ Validation: address / string checks  │  │
 │  │  ├─ Routes: roles · users · moderators · │  │
 │  │  │   settings · content · system         │  │
 │  │  ├─ Contract adapter (ethers v6)         │  │
 │  │  │   • readContract  (provider)          │  │
 │  │  │   • writeContract (operator signer)   │  │
 │  │  ├─ Error mapper: chain revert → HTTP    │  │
 │  │  └─ Docs: OpenAPI 3 → Swagger UI (/docs) │  │
 │  └─────────────────────────────────────────┘  │
 └────────────────────┬──────────────────────────┘
                      │  JSON-RPC (HTTPS)
                      ▼
            ┌──────────────────────┐
            │  Alchemy RPC node    │   gateway to the chain
            └──────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │  ETHEREUM SEPOLIA (chain 11155111)│
        │  ┌────────────────────────────┐   │
        │  │  AdminPanel.sol            │   │  ← STATE LIVES HERE
        │  │  OpenZeppelin AccessControl│   │    users, roles,
        │  │  onlyRole(...) enforcement │   │    settings, events
        │  └────────────────────────────┘   │
        └──────────────────────────────────┘
```

**Design principle:** the API is a **stateless adapter**. It holds no data and makes no
permission decisions — it translates HTTP into contract calls and contract responses
back into HTTP. All authority lives in the contract.

---

## 3. Backend stack

| Component | Choice | Why |
|---|---|---|
| Runtime | Node.js ≥18 | Native `fetch`, LTS, first-class ethers.js support |
| Framework | Express 4 | Minimal, well-understood routing + middleware model |
| Chain client | ethers.js v6 | Standard Ethereum library; typed contract bindings from the ABI |
| Docs | `swagger-ui-express` + OpenAPI 3 | Machine-readable contract; reference cannot drift from code |
| Security | `helmet`, `cors`, `express-rate-limit` | Standard hardening middleware |
| Logging | `morgan` | Request logs streamed to Render's log viewer |
| Config | `dotenv` + environment variables | Secrets never enter source control |

**Module layout** (layered, single responsibility):

```
api/
├── server.js                 # process entry — binds the port
├── src/
│   ├── app.js                # Express app: middleware, routes, error handler
│   ├── config.js             # env parsing + validation (fails fast on bad config)
│   ├── contract.js           # ethers provider, read contract, operator signer
│   ├── openapi.js            # OpenAPI 3 specification
│   ├── util.js               # tx execution + response shaping
│   ├── middleware/
│   │   ├── auth.js           # x-api-key guard (fail-closed)
│   │   ├── validate.js       # address / string input validation
│   │   ├── errors.js         # typed ApiError + chain-error → HTTP mapping
│   │   └── asyncHandler.js   # async route error propagation
│   └── routes/               # roles · users · moderators · settings · content · system
├── public/guide.html         # styled documentation guide (served at /)
└── abi/AdminPanel.json       # compiled contract ABI
```

---

## 4. Data layer — why there is no database

**There is no PostgreSQL/MongoDB/Redis in this system, and that is intentional.**

All persistent state — the user directory, role assignments, active/inactive status,
system settings, and the full audit history — is stored in the **smart contract's
on-chain storage** on Ethereum Sepolia:

| Data | Where it lives |
|---|---|
| Users (`address`, `username`, `isActive`, `joinDate`) | `mapping(address => User)` in contract storage |
| Role assignments (OWNER / MODERATOR / REGULAR_USER) | OpenZeppelin `AccessControl` role mappings |
| System settings | `mapping(string => SystemSetting)` |
| Audit trail | Contract **events** (`AuditLog`, `UserStatusChanged`, …), permanently on-chain |

**Consequences of this choice**
- ✅ **Single source of truth** — no risk of a cache/database drifting from the chain.
- ✅ **Publicly verifiable** — anyone can independently confirm any record on Etherscan; we can't silently alter history.
- ✅ **Stateless API** — the service holds nothing, so it can be restarted or horizontally scaled freely.
- ⚠️ **Trade-off:** reads are network calls to an RPC node (~200–400 ms) rather than local queries, and writes cost gas and take a block to confirm.
- ➡️ **Future option:** add a read-through cache (e.g. Redis) or an event-indexer database for analytics/search — as a *derived* store, never as the source of truth.

---

## 5. Request lifecycle

**Read path** (open, no auth, no gas)
```
GET /api/v1/roles/{address}
  → validate address (checksum)
  → readContract.getUserRole(address)     [eth_call via Alchemy]
  → 200 { address, role }
```

**Write path** (API key required, costs gas)
```
POST /api/v1/users  { address, username }
  → x-api-key guard        → 401 if missing/wrong
                           → 503 if this instance has no operator wallet
  → validate inputs        → 400 on bad address / empty username
  → writeContract.registerUser(...)  signed by the OPERATOR WALLET
  → wait for 1 confirmation
  → 201 { success, txHash, blockNumber, explorerUrl }
```
On-chain reverts (e.g. `"User does not exist"`) are caught and mapped to `409 conflict`
with the human-readable reason — raw hex is never returned.

---

## 6. Hosting & deployment

| Aspect | Detail |
|---|---|
| Provider | **Render** — Web Service |
| Region | Oregon (US West) |
| Plan | Free tier |
| Runtime | Node |
| Root directory | `api` (monorepo — contract, frontend, and API in one repo) |
| Build command | `npm install` |
| Start command | `npm start` → `node server.js` |
| Health check | `/health` (Render probes this) |
| TLS | Terminated by Render (HTTPS enforced, certificate managed) |
| CI/CD | **Push to GitHub `main` → Render rebuilds and redeploys automatically** |

The **frontend dApp is deployed separately on Vercel**; the **contract is deployed to
Sepolia** and verified on Etherscan. Three independent deployment targets, one repository.

**Known free-tier characteristic:** the instance sleeps after ~15 minutes of inactivity;
the next request incurs a ~30–50 s cold start. A paid instance removes this.

---

## 7. Configuration

All configuration is supplied via **environment variables** — no secret is ever committed.
`config.js` validates them at boot and **fails fast** if required values are missing.

| Variable | Required | Purpose |
|---|---|---|
| `RPC_URL` | yes | Alchemy Sepolia JSON-RPC endpoint |
| `CONTRACT_ADDRESS` | yes | Deployed AdminPanel address |
| `CHAIN_ID` | no (`11155111`) | Target network |
| `EXPLORER_BASE` | no | Block-explorer base for returned links |
| `PORT` | no (`8080`) | Bind port (Render injects this) |
| `OPERATOR_PRIVATE_KEY` | writes only | Wallet that signs transactions; **server-side only** |
| `API_KEY` | writes only | Shared secret clients send as `x-api-key` |
| `CORS_ORIGINS` | no (`*`) | Allowed browser origins |

`.env` is git-ignored; only `.env.example` (placeholders) is tracked.

---

## 8. Security model

**Authentication & authorization**
- Writes and admin reads require an **API key** in the `x-api-key` header.
- **Authorization is enforced on-chain, not in the API.** The contract's `onlyRole`
  modifiers are the real gate — even if the API were bypassed and the contract called
  directly, an unauthorized caller's transaction reverts. The API cannot grant itself
  permissions it doesn't hold.
- The API's **operator wallet** holds the `OWNER` role and is the account that signs writes.

**Fail-closed design**
- No operator key configured → the service runs **read-only**; every write returns `503`.
- Operator key configured but **no API key** → writes are **refused**, so the service can
  never become an unauthenticated relayer for on-chain admin actions.
- The public production instance currently runs **read-only** (`writeEnabled: false`), which
  is why it is safe to share the URL openly.

**Key management**
- The operator private key exists **only** in Render's encrypted environment variables.
  It is never in source control, never logged, and never returned by any endpoint.
- Keys are **disposable, testnet-only** — never reused for mainnet.

**Transport & hardening**
- HTTPS enforced by Render; **Helmet** sets security headers.
- **CORS** policy controls which browser origins may call the API.
- **Rate limiting**: 120 requests/minute per IP.
- **Input validation**: EIP-55 address checks, string length bounds, 64 KB JSON body cap.
- **Error hygiene**: structured JSON errors only; no stack traces, internal paths, or raw
  revert hex leak to clients.

---

## 9. Reliability & observability

- **Health endpoint** `/health` reports service status, RPC reachability, current block
  number, contract address, and whether writes are enabled — used by Render's health probe.
- **Request logging** via morgan → Render's live log stream.
- **Stateless service**: no session or local state, so any instance can serve any request;
  restarts are safe and scaling out is trivial.
- **Graceful degradation**: if the RPC provider is unreachable, `/health` reports `degraded`
  and requests return `502 upstream_error` rather than hanging or crashing.

---

## 10. Limits & scaling path

| Current | Consideration | Next step |
|---|---|---|
| Free Render instance | Cold start after idle | Paid instance (always warm) |
| Single operator wallet | Concurrent writes serialize on the wallet nonce | Nonce manager or a pool of signer wallets |
| Direct RPC reads | ~200–400 ms per call | Read-through cache (Redis) for hot reads |
| Single shared API key | No per-client attribution | Per-client API keys + usage quotas |
| Poll-based tx status | Clients must poll `/api/v1/tx/{hash}` | Webhooks / event indexer for push notifications |
| Sepolia testnet | Not production money | Deploy the same contract + API to mainnet or an L2 |

---

## 11. Summary

The AdminPanel API is a **stateless Node.js/Express service hosted on Render** that exposes an
**Ethereum smart contract as a versioned REST API**. It connects to **Ethereum Sepolia through
Alchemy using ethers.js v6**, holds **no database** — the contract's on-chain storage is the
system of record — and secures write operations with an **API key plus on-chain role
enforcement**, deployed continuously from GitHub and documented by a machine-readable
**OpenAPI 3** specification.
