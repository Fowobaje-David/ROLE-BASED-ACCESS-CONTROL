"use strict";
const { fromChainError } = require("./errors");

// Wrap an async route so thrown errors reach the error handler, translating
// chain errors into clean ApiErrors.
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      const mapped = fromChainError(err);
      next(mapped || err);
    });
  };
};
