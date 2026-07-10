"use strict";
const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAddress, requireRoleName } = require("../middleware/validate");
const { readContract } = require("../contract");

const router = express.Router();

// GET /api/v1/roles/:address  -> the wallet's highest role.
router.get(
  "/:address",
  asyncHandler(async (req, res) => {
    const address = requireAddress(req.params.address);
    const role = await readContract.getUserRole(address);
    res.json({ address, role });
  })
);

// GET /api/v1/roles/:address/has/:role  -> boolean check for a specific role.
router.get(
  "/:address/has/:role",
  asyncHandler(async (req, res) => {
    const address = requireAddress(req.params.address);
    const role = requireRoleName(req.params.role);
    const hasRole = await readContract.hasUserRole(address, role);
    res.json({ address, role, hasRole });
  })
);

module.exports = router;
