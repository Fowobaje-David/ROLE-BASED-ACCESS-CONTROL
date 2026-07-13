"use strict";
const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const config = require("../config");
const { mintKey, verifyKey, describe, SCOPES } = require("../apikeys");
const { extractKey } = require("../middleware/auth");
const { badRequest, unauthorized, serviceUnavailable } = require("../middleware/errors");

const router = express.Router();

// POST /api/v1/keys  { name, scope, days }   header: x-admin-secret
// Mint a new API key. Admin-only — protected by ADMIN_SECRET, not an API key.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!config.canIssueKeys) {
      throw serviceUnavailable(
        "Key issuance is not enabled on this instance (API_KEY_SECRET and ADMIN_SECRET must be set)."
      );
    }
    const provided = (req.get("x-admin-secret") || "").trim();
    if (!provided || provided !== config.ADMIN_SECRET) {
      throw unauthorized("Invalid admin secret. Send it in the 'x-admin-secret' header.");
    }

    const name = String(req.body.name || "").trim();
    if (!name) throw badRequest("'name' is required — who is this key for?");

    const scope = String(req.body.scope || "read").toLowerCase();
    if (!SCOPES.includes(scope)) {
      throw badRequest(`'scope' must be one of: ${SCOPES.join(", ")}.`, { scope });
    }

    let days = req.body.days === undefined ? 30 : Number(req.body.days);
    if (!Number.isFinite(days) || days < 0 || days > 365) {
      throw badRequest("'days' must be a number between 0 and 365 (0 = never expires).");
    }

    const { key, payload } = mintKey({ name, scope, days });
    res.status(201).json({
      key, // shown once — the server does not store it
      ...describe(payload),
      usage: "Send this key on protected requests as the 'x-api-key' header.",
    });
  })
);

// GET /api/v1/keys/me  -> inspect the key you're sending (scope, expiry). No secret needed.
router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const raw = extractKey(req);
    if (!raw) throw unauthorized("No API key provided. Send it in the 'x-api-key' header.");
    const result = verifyKey(raw);
    if (!result.ok) throw unauthorized(result.reason);
    res.json({ valid: true, ...describe(result.payload) });
  })
);

module.exports = router;
