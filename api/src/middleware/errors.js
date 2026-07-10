"use strict";

// Typed API error with an HTTP status + machine-readable code.
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const badRequest = (msg, details) => new ApiError(400, "bad_request", msg, details);
const unauthorized = (msg) => new ApiError(401, "unauthorized", msg);
const notFound = (msg) => new ApiError(404, "not_found", msg || "Resource not found.");
const conflict = (msg) => new ApiError(409, "conflict", msg);
const serviceUnavailable = (msg) => new ApiError(503, "service_unavailable", msg);
const badGateway = (msg) => new ApiError(502, "upstream_error", msg);

// Translate an ethers/chain error into a clean ApiError (no raw hex leaked).
function fromChainError(err) {
  // Solidity require(...) revert reasons.
  const reason =
    err?.reason ||
    err?.revert?.args?.[0] ||
    err?.shortMessage;

  if (err?.code === "CALL_EXCEPTION") {
    const name = err?.revert?.name || err?.errorName;
    if (name === "AccessControlUnauthorizedAccount") {
      return conflict(
        "The operator wallet does not hold the on-chain role required for this action."
      );
    }
    if (reason) return conflict(reason); // e.g. "User does not exist"
    return conflict("Transaction reverted on-chain.");
  }
  if (err?.code === "INSUFFICIENT_FUNDS") {
    return serviceUnavailable(
      "Operator wallet has insufficient Sepolia ETH to cover gas."
    );
  }
  if (err?.code === "INVALID_ARGUMENT") {
    return badRequest(reason || "Invalid argument for contract call.");
  }
  if (
    err?.code === "NETWORK_ERROR" ||
    err?.code === "SERVER_ERROR" ||
    err?.code === "TIMEOUT"
  ) {
    return badGateway("Could not reach the blockchain RPC endpoint.");
  }
  return null;
}

module.exports = {
  ApiError,
  badRequest,
  unauthorized,
  notFound,
  conflict,
  serviceUnavailable,
  badGateway,
  fromChainError,
};
