"use strict";
const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const config = require("../config");
const { provider, readContract, operatorAddress, writeEnabled, explorerTx } = require("../contract");
const { badRequest } = require("../middleware/errors");

const router = express.Router();

// GET /health  -> liveness + on-chain connectivity snapshot.
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    let blockNumber = null;
    let chainOk = false;
    try {
      blockNumber = await provider.getBlockNumber();
      chainOk = true;
    } catch (_) {
      chainOk = false;
    }
    res.status(chainOk ? 200 : 503).json({
      status: chainOk ? "ok" : "degraded",
      version: config.VERSION,
      network: { chainId: config.CHAIN_ID, rpcReachable: chainOk, blockNumber },
      contract: config.CONTRACT_ADDRESS,
      writeEnabled,
      operator: writeEnabled ? operatorAddress : null,
    });
  })
);

// GET /api/v1/tx/:hash  -> confirmation status of any transaction hash.
router.get(
  "/api/v1/tx/:hash",
  asyncHandler(async (req, res) => {
    const hash = String(req.params.hash || "");
    if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      throw badRequest("'hash' must be a 32-byte 0x-prefixed transaction hash.");
    }
    const receipt = await provider.getTransactionReceipt(hash);
    if (!receipt) {
      return res.json({ hash, status: "pending", explorerUrl: explorerTx(hash) });
    }
    res.json({
      hash,
      status: receipt.status === 1 ? "confirmed" : "failed",
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: explorerTx(hash),
    });
  })
);

module.exports = router;
