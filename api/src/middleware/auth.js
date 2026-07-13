"use strict";
const config = require("../config");
const { verifyKey, satisfies, describe } = require("../apikeys");
const { unauthorized, forbidden, serviceUnavailable } = require("./errors");

// Read the key from `x-api-key` or an `Authorization: Bearer …` header.
function extractKey(req) {
  const h = req.get("x-api-key");
  if (h) return h.trim();
  const auth = req.get("authorization") || "";
  if (/^bearer\s+/i.test(auth)) return auth.replace(/^bearer\s+/i, "").trim();
  return "";
}

/**
 * Gate a route on an API key with at least `required` scope.
 *   requireScope("read")  — admin reads (list users, count). No gas.
 *   requireScope("write") — on-chain writes. Needs an operator wallet too.
 *
 * Fail-closed: if the server has no key auth configured at all, writes are
 * refused so the service can never act as an unauthenticated relayer.
 */
function requireScope(required) {
  return function (req, res, next) {
    if (!config.hasApiKey) {
      return next(
        serviceUnavailable(
          "Key authentication is not configured on this instance, so protected endpoints are disabled."
        )
      );
    }
    if (required === "write" && !config.hasOperatorKey) {
      return next(
        serviceUnavailable(
          "Write operations are disabled on this instance (no operator wallet configured). This is a read-only API."
        )
      );
    }

    const raw = extractKey(req);
    if (!raw) {
      return next(
        unauthorized("Missing API key. Send it in the 'x-api-key' header.")
      );
    }

    const result = verifyKey(raw);
    if (!result.ok) return next(unauthorized(result.reason));

    if (!satisfies(result.payload.s, required)) {
      return next(
        forbidden(
          `This API key has '${result.payload.s}' scope, but this endpoint requires '${required}' scope.`,
          { scope: result.payload.s, required }
        )
      );
    }

    req.apiKey = describe(result.payload);
    return next();
  };
}

module.exports = requireScope;
module.exports.requireScope = requireScope;
module.exports.extractKey = extractKey;
