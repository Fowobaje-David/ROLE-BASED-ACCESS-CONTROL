"use strict";
const crypto = require("crypto");
const config = require("./config");

/**
 * Stateless, HMAC-signed API keys — no database required.
 *
 * Format:  ap_<env>_<payload>.<signature>
 *   payload   = base64url(JSON)  { k, n, s, i, e }
 *   signature = base64url(HMAC-SHA256(payload, API_KEY_SECRET))
 *
 *   k = key id (for revocation)   n = name/owner
 *   s = scope: "read" | "write"   i = issued at (unix)   e = expires at (unix, 0 = never)
 *
 * The server verifies a key by recomputing the signature, so keys cannot be
 * forged and nothing needs to be stored. Revocation is handled by listing key
 * ids in REVOKED_KEYS, and by keeping expiries short.
 */

const SCOPES = ["read", "write"];
const b64u = (buf) => Buffer.from(buf).toString("base64url");
const unb64u = (s) => Buffer.from(s, "base64url");

function sign(payloadB64) {
  return b64u(
    crypto.createHmac("sha256", config.API_KEY_SECRET).update(payloadB64).digest()
  );
}

/** Mint a new key. Throws if the signing secret is not configured. */
function mintKey({ name, scope = "read", days = 30 }) {
  if (!config.API_KEY_SECRET) {
    throw new Error("API_KEY_SECRET is not set — cannot issue signed keys.");
  }
  if (!SCOPES.includes(scope)) {
    throw new Error(`scope must be one of: ${SCOPES.join(", ")}`);
  }
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    k: crypto.randomBytes(6).toString("hex"),
    n: String(name || "unnamed").slice(0, 64),
    s: scope,
    i: now,
    e: days > 0 ? now + days * 86400 : 0,
  };
  const p = b64u(JSON.stringify(payload));
  return { key: `ap_live_${p}.${sign(p)}`, payload };
}

/** Verify a key. Returns { ok, payload } or { ok:false, reason }. */
function verifyKey(raw) {
  const key = String(raw || "").trim();
  if (!key) return { ok: false, reason: "No API key provided." };

  // Legacy shared key (from API_KEY env) — full write scope, never expires.
  if (config.API_KEY && key === config.API_KEY) {
    return { ok: true, payload: { k: "legacy", n: "shared", s: "write", i: 0, e: 0 } };
  }

  if (!key.startsWith("ap_live_")) return { ok: false, reason: "Malformed API key." };
  if (!config.API_KEY_SECRET) {
    return { ok: false, reason: "Signed keys are not enabled on this server." };
  }

  const body = key.slice("ap_live_".length);
  const dot = body.lastIndexOf(".");
  if (dot < 1) return { ok: false, reason: "Malformed API key." };

  const p = body.slice(0, dot);
  const sig = body.slice(dot + 1);
  const expected = sign(p);

  // Timing-safe comparison.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "Invalid API key signature." };
  }

  let payload;
  try {
    payload = JSON.parse(unb64u(p).toString("utf8"));
  } catch (_) {
    return { ok: false, reason: "Malformed API key payload." };
  }

  if (config.REVOKED_KEYS.includes(payload.k)) {
    return { ok: false, reason: "This API key has been revoked." };
  }
  if (payload.e && Math.floor(Date.now() / 1000) > payload.e) {
    return { ok: false, reason: "This API key has expired." };
  }
  if (!SCOPES.includes(payload.s)) {
    return { ok: false, reason: "API key has an unknown scope." };
  }
  return { ok: true, payload };
}

/** Does a key's scope satisfy the scope an endpoint requires? (write implies read) */
function satisfies(keyScope, required) {
  if (required === "read") return keyScope === "read" || keyScope === "write";
  if (required === "write") return keyScope === "write";
  return false;
}

const describe = (p) => ({
  id: p.k,
  name: p.n,
  scope: p.s,
  issuedAt: p.i ? new Date(p.i * 1000).toISOString() : null,
  expiresAt: p.e ? new Date(p.e * 1000).toISOString() : null,
});

module.exports = { mintKey, verifyKey, satisfies, describe, SCOPES };
