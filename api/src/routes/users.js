"use strict";
const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const requireApiKey = require("../middleware/auth");
const { requireAddress, requireString } = require("../middleware/validate");
const { readContract, writeContract } = require("../contract");
const { notFound, serviceUnavailable } = require("../middleware/errors");
const { sendTx, formatUser } = require("../util");

const router = express.Router();

function operatorOr503() {
  if (!writeContract) {
    throw serviceUnavailable(
      "This endpoint requires an operator wallet (role-gated on-chain). Configure OPERATOR_PRIVATE_KEY, or use the public read endpoints."
    );
  }
  return writeContract;
}

// --- Admin reads (role-gated on-chain -> API-key protected) ---

// GET /api/v1/users  -> full user directory (contract: onlyRole OWNER, view/no gas).
router.get(
  "/",
  requireApiKey,
  asyncHandler(async (req, res) => {
    const users = await operatorOr503().getAllUsers();
    res.json({ count: users.length, users: users.map(formatUser) });
  })
);

// GET /api/v1/users/count  -> number of registered users (contract: onlyRole MODERATOR).
router.get(
  "/count",
  requireApiKey,
  asyncHandler(async (req, res) => {
    const count = await operatorOr503().getUserCount();
    res.json({ count: Number(count) });
  })
);

// --- Public reads ---

// GET /api/v1/users/:address  -> a single user's public profile.
router.get(
  "/:address",
  asyncHandler(async (req, res) => {
    const address = requireAddress(req.params.address);
    const u = await readContract.users(address);
    if (u.userAddress === "0x0000000000000000000000000000000000000000") {
      throw notFound(`No user registered for ${address}.`);
    }
    res.json(formatUser(u));
  })
);

// GET /api/v1/users/:address/active  -> active status flag.
router.get(
  "/:address/active",
  asyncHandler(async (req, res) => {
    const address = requireAddress(req.params.address);
    const isActive = await readContract.isUserActive(address);
    res.json({ address, isActive });
  })
);

// --- Writes (API-key protected; server signs as operator) ---

// POST /api/v1/users  { address, username }  -> registerUser (grants REGULAR_USER).
router.post(
  "/",
  requireApiKey,
  asyncHandler(async (req, res) => {
    const address = requireAddress(req.body.address);
    const username = requireString(req.body.username, "username", { maxLength: 256 });
    const result = await sendTx(
      () => operatorOr503().registerUser(address, username),
      { action: "registerUser", address, username }
    );
    res.status(201).json(result);
  })
);

// DELETE /api/v1/users/:address  -> removeUser (deactivate + revoke roles).
router.delete(
  "/:address",
  requireApiKey,
  asyncHandler(async (req, res) => {
    const address = requireAddress(req.params.address);
    const result = await sendTx(
      () => operatorOr503().removeUser(address),
      { action: "removeUser", address }
    );
    res.json(result);
  })
);

// POST /api/v1/users/:address/deactivate  -> deactivateUser (moderator action).
router.post(
  "/:address/deactivate",
  requireApiKey,
  asyncHandler(async (req, res) => {
    const address = requireAddress(req.params.address);
    const result = await sendTx(
      () => operatorOr503().deactivateUser(address),
      { action: "deactivateUser", address }
    );
    res.json(result);
  })
);

// POST /api/v1/users/:address/reactivate  -> reactivateUser (moderator action).
router.post(
  "/:address/reactivate",
  requireApiKey,
  asyncHandler(async (req, res) => {
    const address = requireAddress(req.params.address);
    const result = await sendTx(
      () => operatorOr503().reactivateUser(address),
      { action: "reactivateUser", address }
    );
    res.json(result);
  })
);

module.exports = router;
