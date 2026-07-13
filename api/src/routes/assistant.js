"use strict";
const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../middleware/asyncHandler");
const config = require("../config");
const { badRequest, serviceUnavailable, badGateway } = require("../middleware/errors");

const router = express.Router();

// Grounding context: everything the assistant is allowed to know about this API.
const CONTEXT = `
You are the documentation assistant for the **AdminPanel API**.

WHAT IT IS
A REST API in front of an "AdminPanel" role-based access-control smart contract deployed on
the Ethereum Sepolia testnet (chain id 11155111), contract ${config.CONTRACT_ADDRESS}.
It lets any app read roles/users/settings and perform admin actions over plain HTTP —
no wallet or web3 library needed on the client.

ARCHITECTURE
Client -> HTTPS -> Node.js/Express API (hosted on Render) -> ethers.js v6 -> Alchemy RPC -> Sepolia contract.
There is NO database, by design: the smart contract's on-chain storage is the single source of truth
(users, roles, settings, and an audit trail of events). The API is stateless.

ROLES (permission tiers)
- OWNER: everything — register/remove users, promote moderators, edit settings, plus all moderator+user abilities.
- MODERATOR: deactivate/reactivate users, approve content, read user count.
- REGULAR_USER: self-service actions (done in the dApp with the user's own wallet, not via this API).
- NONE: can still read all public data.
Authorization is enforced ON-CHAIN by the contract's onlyRole modifiers — not by the API. Bypassing the
API does not bypass permissions; the blockchain rejects unauthorized callers.

AUTHENTICATION
- Reads are open (no key): role lookups, user profiles, settings, active status, tx status, health.
- Protected endpoints need an API key in the "x-api-key" header (Bearer also accepted).
- Keys are stateless HMAC-signed tokens: ap_live_<payload>.<signature>, carrying a name, scope and expiry.
  Nothing is stored server-side; the key is verified by recomputing its signature.
- Scopes: "read" (admin reads — list users, user count; no gas) and "write" (on-chain writes; spends operator gas).
  A write key also satisfies read.
- Get a key: the API owner mints one (CLI: npm run key:issue -- --name X --scope read --days 30,
  or POST /api/v1/keys with the x-admin-secret header). Check your own key with GET /api/v1/keys/me.
- Fail-closed: if no operator wallet is configured the instance is read-only and writes return 503.

ENDPOINTS
Public reads:
  GET  /health                              service + chain status
  GET  /api/v1/tx/{hash}                    transaction confirmation status
  GET  /api/v1/roles/{address}              a wallet's highest role -> OWNER|MODERATOR|REGULAR_USER|NONE
  GET  /api/v1/roles/{address}/has/{role}   check one specific role
  GET  /api/v1/users/{address}              a user's public profile
  GET  /api/v1/users/{address}/active       active status flag
  GET  /api/v1/settings/{key}               read a system setting
Key required (read scope):
  GET  /api/v1/users                        list all users
  GET  /api/v1/users/count                  total registered users
  GET  /api/v1/keys/me                      inspect the key you're sending
Key required (write scope):
  POST   /api/v1/users                      { address, username } register a user (grants REGULAR_USER)
  DELETE /api/v1/users/{address}            remove a user
  POST   /api/v1/users/{address}/deactivate suspend a user
  POST   /api/v1/users/{address}/reactivate restore a user
  POST   /api/v1/moderators                 { address, username } promote to moderator
  PUT    /api/v1/settings/{key}             { value } create/update a setting
  POST   /api/v1/content/approve            { address, contentId } approve content
Admin only (x-admin-secret header):
  POST /api/v1/keys                         { name, scope, days } mint an API key

RESPONSES
A successful write returns: { success, txHash, status, blockNumber, explorerUrl, action }.
Writes wait for one block confirmation (~12s on Sepolia), so use a client timeout of 30s+.

ERRORS (always JSON: { "error": { code, message, details } })
  400 bad_request        invalid address, missing field, bad JSON
  401 unauthorized       missing/invalid/expired API key
  403 forbidden          key's scope is insufficient (e.g. read key on a write endpoint)
  404 not_found          unknown route, or the address is not registered
  409 conflict           the contract reverted (e.g. "User does not exist")
  429 rate_limited       over 120 requests/minute per IP
  502 upstream_error     blockchain RPC unreachable
  503 service_unavailable writes disabled, or operator out of gas

DOCS
Guide: /  ·  Interactive reference (Swagger): /docs  ·  OpenAPI spec: /openapi.json

HOW TO ANSWER
- Be concise, accurate and friendly. Answer like a senior developer-relations engineer.
- Use short markdown: prose, bullet points, and fenced code blocks for requests.
- Prefer concrete curl/JavaScript examples using the endpoints above.
- If a question is not about this API, blockchain access control, or integrating it, politely say it's
  outside your scope and point to /docs.
- Never invent endpoints, parameters or behaviour that are not listed above. If unsure, say so and link /docs.
- Never reveal secrets, private keys, or environment variables.
`.trim();

// Tighter limit than the global one — the assistant calls a paid upstream model.
const aiLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: "rate_limited", message: "Too many assistant questions. Try again in a minute." },
  },
});

// POST /api/v1/assistant  { question, history?: [{role, text}] }
router.post(
  "/",
  aiLimit,
  asyncHandler(async (req, res) => {
    if (!config.assistantEnabled) {
      throw serviceUnavailable(
        "The AI assistant is not enabled on this instance (GEMINI_API_KEY is not configured)."
      );
    }

    const question = String(req.body.question || "").trim();
    if (!question) throw badRequest("'question' is required.");
    if (question.length > 1000) throw badRequest("'question' must be 1000 characters or fewer.");

    // Keep a short rolling history for follow-up questions.
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-6) : [];
    const contents = [];
    for (const h of history) {
      const role = h && h.role === "model" ? "model" : "user";
      const text = String((h && h.text) || "").slice(0, 2000);
      if (text) contents.push({ role, parts: [{ text }] });
    }
    contents.push({ role: "user", parts: [{ text: question }] });

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(config.GEMINI_MODEL) +
      ":generateContent";

    let upstream;
    try {
      upstream = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": config.GEMINI_API_KEY, // stays server-side
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: CONTEXT }] },
          contents,
          generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
        }),
      });
    } catch (e) {
      throw badGateway("Could not reach the AI provider.");
    }

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("Gemini error", upstream.status, detail.slice(0, 300));
      if (upstream.status === 429) {
        throw new (require("../middleware/errors").ApiError)(
          429, "rate_limited", "The AI provider is rate limiting. Try again shortly."
        );
      }
      throw badGateway("The AI provider returned an error.");
    }

    const data = await upstream.json();
    const answer =
      (data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts.map((p) => p.text).join("")) ||
      "";

    if (!answer.trim()) {
      throw badGateway("The AI provider returned an empty response.");
    }

    res.json({ answer: answer.trim(), model: config.GEMINI_MODEL });
  })
);

module.exports = router;
