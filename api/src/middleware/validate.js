"use strict";
const { ethers } = require("ethers");
const { badRequest } = require("./errors");

// Validate + checksum an Ethereum address, or throw a 400.
function requireAddress(value, field = "address") {
  if (typeof value !== "string" || !ethers.isAddress(value)) {
    throw badRequest(`'${field}' must be a valid Ethereum address.`, { field, value });
  }
  return ethers.getAddress(value);
}

// Validate a required non-empty string body field, or throw a 400.
function requireString(value, field, { maxLength = 4096 } = {}) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw badRequest(`'${field}' is required and must be a non-empty string.`, { field });
  }
  if (value.length > maxLength) {
    throw badRequest(`'${field}' exceeds the maximum length of ${maxLength}.`, { field });
  }
  return value;
}

const ROLE_NAMES = ["OWNER", "MODERATOR", "REGULAR_USER"];
function requireRoleName(value, field = "role") {
  const v = String(value || "").toUpperCase();
  if (!ROLE_NAMES.includes(v)) {
    throw badRequest(`'${field}' must be one of: ${ROLE_NAMES.join(", ")}.`, { field, value });
  }
  return v;
}

module.exports = { requireAddress, requireString, requireRoleName, ROLE_NAMES };
