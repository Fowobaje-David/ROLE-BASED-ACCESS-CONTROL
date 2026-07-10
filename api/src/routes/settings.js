"use strict";
const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const requireApiKey = require("../middleware/auth");
const { requireString } = require("../middleware/validate");
const { readContract, writeContract } = require("../contract");
const { serviceUnavailable } = require("../middleware/errors");
const { sendTx } = require("../util");

const router = express.Router();

// GET /api/v1/settings/:key  -> a system setting's value (public; "" if unset).
router.get(
  "/:key",
  asyncHandler(async (req, res) => {
    const key = requireString(req.params.key, "key", { maxLength: 256 });
    const value = await readContract.getSystemSetting(key);
    res.json({ key, value });
  })
);

// PUT /api/v1/settings/:key  { value }  -> updateSystemSetting (owner action).
router.put(
  "/:key",
  requireApiKey,
  asyncHandler(async (req, res) => {
    if (!writeContract) throw serviceUnavailable("Operator wallet not configured.");
    const key = requireString(req.params.key, "key", { maxLength: 256 });
    // value may be an empty string intentionally; only require the field to exist.
    const value = typeof req.body.value === "string" ? req.body.value : "";
    const result = await sendTx(
      () => writeContract.updateSystemSetting(key, value),
      { action: "updateSystemSetting", key, value }
    );
    res.json(result);
  })
);

module.exports = router;
