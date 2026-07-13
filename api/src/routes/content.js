"use strict";
const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { requireScope } = require("../middleware/auth");
const { requireAddress, requireString } = require("../middleware/validate");
const { writeContract } = require("../contract");
const { serviceUnavailable } = require("../middleware/errors");
const { sendTx } = require("../util");

const router = express.Router();

// POST /api/v1/content/approve  { address, contentId }  -> approveUserContent (moderator).
router.post(
  "/approve",
  requireScope("write"),
  asyncHandler(async (req, res) => {
    if (!writeContract) throw serviceUnavailable("Operator wallet not configured.");
    const address = requireAddress(req.body.address);
    const contentId = requireString(req.body.contentId, "contentId", { maxLength: 512 });
    const result = await sendTx(
      () => writeContract.approveUserContent(address, contentId),
      { action: "approveUserContent", address, contentId }
    );
    res.status(201).json(result);
  })
);

module.exports = router;
