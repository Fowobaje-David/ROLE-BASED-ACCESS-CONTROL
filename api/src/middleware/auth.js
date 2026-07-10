"use strict";
const config = require("../config");
const { unauthorized, serviceUnavailable } = require("./errors");

// Gate for WRITE endpoints:
//  - 503 if this instance has no operator key (read-only deployment).
//  - 503 if an operator key is set but no API_KEY (fail closed — refuse to be an
//    unauthenticated relayer).
//  - 401 if the x-api-key header is missing or wrong.
module.exports = function requireApiKey(req, res, next) {
  if (!config.hasOperatorKey) {
    return next(
      serviceUnavailable(
        "Write operations are disabled on this instance (no operator wallet configured). This is a read-only API."
      )
    );
  }
  if (!config.hasApiKey) {
    return next(
      serviceUnavailable(
        "Write operations are disabled: server has an operator key but no API_KEY configured."
      )
    );
  }
  const provided = req.get("x-api-key") || "";
  if (provided !== config.API_KEY) {
    return next(unauthorized("Missing or invalid API key. Send it in the 'x-api-key' header."));
  }
  return next();
};
