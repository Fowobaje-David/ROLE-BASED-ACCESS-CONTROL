# AdminPanel API

A REST API over the **AdminPanel** role-based access-control smart contract on
Ethereum **Sepolia**. It lets any application read roles/users/settings and (with
an API key) perform admin actions over plain HTTP — no wallet or web3 library
required on the client side.

- **Interactive reference (Swagger UI):** `GET /docs`
- **OpenAPI spec:** `GET /openapi.json`
- **Health:** `GET /health`
- **Underlying contract:** [`0x18a5883dA6302e13021910235Cb74653b8804505`](https://sepolia.etherscan.io/address/0x18a5883dA6302e13021910235Cb74653b8804505#code) (verified)

---

## Contents
1. [Concepts](#concepts)
2. [Base URL & versioning](#base-url--versioning)
3. [Authentication](#authentication)
4. [Quickstart](#quickstart)
5. [Endpoint reference](#endpoint-reference)
6. [Responses & errors](#responses--errors)
7. [Integration examples](#integration-examples)
8. [Running locally](#running-locally)
9. [Deployment](#deployment)
10. [Security model](#security-model)

---

## Concepts

The contract enforces four permission tiers. The API mirrors them:

| Role | Can do |
|---|---|
| `OWNER` | Everything: register/remove users, promote moderators, edit settings, moderate |
| `MODERATOR` | Moderate: deactivate/reactivate users, approve content + everything a user can |
| `REGULAR_USER` | Self-service (managed from the dApp, not this API) |
| `NONE` | Read public data only |

**Read** endpoints are open. **Write** endpoints are executed on-chain by a
server-side **operator wallet** and require an **API key**. Writes cost gas
(paid by the operator wallet in Sepolia ETH).

> Wallet-self actions (`updateProfile`, `submitFeedback`, `getMyProfile`) are
> intentionally **not** exposed — they are `msg.sender`-scoped end-user actions
> that belong in the dApp with the user's own wallet, not a shared server relayer.

---

## Base URL & versioning

```
https://<your-host>/           # landing + docs
https://<your-host>/api/v1/... # versioned API
```

All resource endpoints are under `/api/v1`. Breaking changes will ship under a new
version prefix.

---

## Authentication

- **Read endpoints:** no auth.
- **Write endpoints** and **admin reads** (`GET /api/v1/users`, `GET /api/v1/users/count`):
  send your key in the **`x-api-key`** header.

```
x-api-key: <YOUR_API_KEY>
```

If the server is deployed **read-only** (no operator wallet configured), write
endpoints return `503`.

---

## Quickstart

```bash
# 1. Look up a wallet's role (open)
curl https://<your-host>/api/v1/roles/0xd7C1D2D96cc9cD8D9e90876f77c1DBeC8A33B857
# -> {"address":"0xd7C1…B857","role":"OWNER"}

# 2. Register a user (requires API key; server signs the tx)
curl -X POST https://<your-host>/api/v1/users \
  -H "content-type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"address":"0x7E2C9…85d7d","username":"alice"}'
# -> {"success":true,"txHash":"0x…","explorerUrl":"https://sepolia.etherscan.io/tx/0x…"}
```

---

## Endpoint reference

> Full, always-current reference with a **Try it out** console is at **`/docs`**.

### System
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Liveness + chain connectivity |
| GET | `/api/v1/tx/{hash}` | — | Confirmation status of a tx hash |

### Roles
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/roles/{address}` | — | Wallet's highest role (`OWNER`/`MODERATOR`/`REGULAR_USER`/`NONE`) |
| GET | `/api/v1/roles/{address}/has/{role}` | — | Boolean check for a specific role |

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users` | key | List all users (admin) |
| GET | `/api/v1/users/count` | key | Total registered users |
| GET | `/api/v1/users/{address}` | — | A user's public profile |
| GET | `/api/v1/users/{address}/active` | — | Active status flag |
| POST | `/api/v1/users` | key | Register a user → grants `REGULAR_USER` |
| DELETE | `/api/v1/users/{address}` | key | Remove a user (deactivate + revoke roles) |
| POST | `/api/v1/users/{address}/deactivate` | key | Deactivate a user |
| POST | `/api/v1/users/{address}/reactivate` | key | Reactivate a user |

### Moderators / Settings / Content
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/moderators` | key | Promote an address to moderator |
| GET | `/api/v1/settings/{key}` | — | Read a system setting |
| PUT | `/api/v1/settings/{key}` | key | Create/update a system setting |
| POST | `/api/v1/content/approve` | key | Approve user content |

**Request bodies**
- `POST /api/v1/users` · `POST /api/v1/moderators` → `{ "address": "0x…", "username": "string" }`
- `PUT /api/v1/settings/{key}` → `{ "value": "string" }`
- `POST /api/v1/content/approve` → `{ "address": "0x…", "contentId": "string" }`

---

## Responses & errors

**Successful write:**
```json
{
  "success": true,
  "txHash": "0xabc…",
  "status": "confirmed",
  "blockNumber": 6543210,
  "explorerUrl": "https://sepolia.etherscan.io/tx/0xabc…",
  "action": "registerUser"
}
```

**Errors** are always JSON:
```json
{ "error": { "code": "bad_request", "message": "…", "details": { } } }
```

| Status | `code` | Meaning |
|---|---|---|
| 400 | `bad_request` / `bad_json` | Invalid input |
| 401 | `unauthorized` | Missing/invalid API key |
| 404 | `not_found` | Unknown route or unregistered user |
| 409 | `conflict` | On-chain revert (e.g. "User does not exist") |
| 429 | `rate_limited` | Too many requests (120/min/IP) |
| 502 | `upstream_error` | RPC/chain unreachable |
| 503 | `service_unavailable` | Writes disabled, or operator out of gas |

---

## Integration examples

**JavaScript (fetch)**
```js
const BASE = "https://<your-host>";

// read
const { role } = await fetch(`${BASE}/api/v1/roles/${address}`).then(r => r.json());

// write
const res = await fetch(`${BASE}/api/v1/users`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-api-key": process.env.API_KEY },
  body: JSON.stringify({ address, username: "alice" }),
});
const result = await res.json();
console.log(result.explorerUrl);
```

**Python (requests)**
```python
import requests
BASE = "https://<your-host>"

role = requests.get(f"{BASE}/api/v1/roles/{address}").json()["role"]

res = requests.post(
    f"{BASE}/api/v1/users",
    headers={"x-api-key": API_KEY},
    json={"address": address, "username": "alice"},
)
print(res.json()["explorerUrl"])
```

**curl**
```bash
curl "$BASE/api/v1/users/$ADDRESS"                       # profile
curl -X POST "$BASE/api/v1/moderators" \
  -H "content-type: application/json" -H "x-api-key: $API_KEY" \
  -d '{"address":"0x…","username":"bob"}'                # promote
```

---

## Running locally

```bash
cd api
npm install
cp .env.example .env      # fill RPC_URL, CONTRACT_ADDRESS
npm start                 # http://localhost:8080  (docs at /docs)
```

Leave `OPERATOR_PRIVATE_KEY` / `API_KEY` blank to run **read-only**. Set **both**
to enable write endpoints.

| Var | Required | Purpose |
|---|---|---|
| `RPC_URL` | yes | Sepolia RPC endpoint |
| `CONTRACT_ADDRESS` | yes | Deployed AdminPanel address |
| `CHAIN_ID` | no (11155111) | Network id |
| `EXPLORER_BASE` | no | Block explorer base URL |
| `PORT` | no (8080) | HTTP port |
| `OPERATOR_PRIVATE_KEY` | for writes | Operator wallet (must hold OWNER role) |
| `API_KEY` | for writes | Shared secret clients send as `x-api-key` |
| `CORS_ORIGINS` | no (`*`) | Comma-separated allowed origins |

---

## Deployment

### Render (recommended — persistent server, free tier)
1. Push this repo to GitHub (already done).
2. Render → **New + → Blueprint**, select the repo (uses `api/render.yaml`), **or**
   New Web Service with **Root Directory = `api`**, build `npm install`, start `npm start`.
3. Add env vars: `RPC_URL`, `CONTRACT_ADDRESS`, and (optional) `OPERATOR_PRIVATE_KEY` + `API_KEY`.
4. Health check path: `/health`. Deploy → your API is at `https://<name>.onrender.com`.

### Vercel (serverless)
Import the repo, set **Root Directory = `api`**. `api/vercel.json` routes all
requests to the Express app. Add the same env vars in project settings.

---

## Security model

- **Reads are trustless** — they only call `view` functions; no key involved.
- **Writes are custodial**: the operator wallet's private key lives **only** in the
  server environment and is **never** returned by any endpoint. Whoever holds the
  API key can trigger on-chain admin actions, so treat the API key like a password
  and always serve the API over HTTPS.
- The operator wallet must hold the `OWNER` role on the contract and be funded with
  Sepolia ETH for gas.
- Use a **disposable, testnet-only** operator key. Never use a mainnet key.
- Restrict `CORS_ORIGINS` and rotate the `API_KEY` if it may have leaked.
```
