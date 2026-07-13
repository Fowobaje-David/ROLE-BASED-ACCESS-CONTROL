"use strict";
const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { requireScope } = require("../middleware/auth");
const { requireAddress, requireString } = require("../middleware/validate");
const { writeContract } = require("../contract");
const { serviceUnavailable } = require("../middleware/errors");
const { sendTx } = require("../util");

const router = express.Router();

// POST /api/v1/moderators  { address, username }  -> promoteModerator (grants MODERATOR).
router.post(
  "/",
  requireScope("write"),
  asyncHandler(async (req, res) => {
    if (!writeContract) throw serviceUnavailable("Operator wallet not configured.");
    const address = requireAddress(req.body.address);
    const username = requireString(req.body.username, "username", { maxLength: 256 });
    const result = await sendTx(
      () => writeContract.promoteModerator(address, username),
      { action: "promoteModerator", address, username }
    );
    res.status(201).json(result);
  })
);

module.exports = router;
