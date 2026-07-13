"use strict";
const config = require("./config");

// OpenAPI 3.0 description of the AdminPanel API. Served as JSON at /openapi.json
// and rendered as interactive docs at /docs (Swagger UI).
const txResult = {
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    txHash: { type: "string", example: "0xabc123…" },
    status: { type: "string", enum: ["confirmed", "failed"] },
    blockNumber: { type: "integer", example: 6543210 },
    explorerUrl: { type: "string", example: "https://sepolia.etherscan.io/tx/0xabc123…" },
    action: { type: "string", example: "registerUser" },
  },
};

const user = {
  type: "object",
  properties: {
    address: { type: "string", example: "0x7E2C9…85d7d" },
    username: { type: "string", example: "alice" },
    isActive: { type: "boolean", example: true },
    joinDate: { type: "integer", description: "Unix seconds", example: 1720000000 },
    joinDateISO: { type: "string", format: "date-time" },
  },
};

const errorObj = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string", example: "bad_request" },
        message: { type: "string", example: "'address' must be a valid Ethereum address." },
        details: { type: "object", nullable: true },
      },
    },
  },
};

const ADDRESS_PARAM = {
  name: "address",
  in: "path",
  required: true,
  schema: { type: "string" },
  description: "Ethereum address (0x-prefixed, 40 hex chars).",
};

const writeResponses = {
  201: { description: "Transaction confirmed.", content: { "application/json": { schema: { $ref: "#/components/schemas/TxResult" } } } },
  200: { description: "Transaction confirmed.", content: { "application/json": { schema: { $ref: "#/components/schemas/TxResult" } } } },
  400: { description: "Invalid input.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  401: { description: "Missing or invalid API key.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  409: { description: "On-chain revert (e.g. user does not exist).", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  503: { description: "Writes disabled on this instance (read-only).", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
};

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "AdminPanel API",
    version: config.VERSION,
    description:
      "REST API over the AdminPanel role-based access-control smart contract on " +
      "Ethereum Sepolia. Read endpoints are public. Protected endpoints require an " +
      "API key in the `x-api-key` header.\n\n" +
      "**Key scopes** — `read` unlocks admin reads (list users, user count; no gas). " +
      "`write` additionally unlocks on-chain writes, which are signed server-side by an " +
      "operator wallet and spend gas. A `read` key on a write endpoint returns `403`.\n\n" +
      "Keys are stateless HMAC-signed tokens carrying a name, scope and expiry — " +
      "nothing is stored server-side. Get one from the API owner, then check it with " +
      "`GET /api/v1/keys/me`.\n\n" +
      "Contract: `" + config.CONTRACT_ADDRESS + "`",
    contact: { name: "AdminPanel API" },
    license: { name: "MIT" },
  },
  servers: [{ url: "/", description: "This host" }],
  tags: [
    { name: "System", description: "Health & transaction status." },
    { name: "Roles", description: "Read role assignments." },
    { name: "Users", description: "User directory & lifecycle." },
    { name: "Moderators", description: "Moderator promotion." },
    { name: "Settings", description: "System settings." },
    { name: "Content", description: "Content moderation." },
    { name: "API keys", description: "Issue and inspect API keys (stateless, HMAC-signed, scoped)." },
    { name: "Assistant", description: "AI documentation assistant." },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
    },
    schemas: { TxResult: txResult, User: user, Error: errorObj },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Service health & chain connectivity",
        responses: { 200: { description: "OK" }, 503: { description: "RPC unreachable" } },
      },
    },
    "/api/v1/tx/{hash}": {
      get: {
        tags: ["System"],
        summary: "Get a transaction's confirmation status",
        parameters: [{ name: "hash", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Status" }, 400: { description: "Bad hash" } },
      },
    },
    "/api/v1/roles/{address}": {
      get: {
        tags: ["Roles"],
        summary: "Get a wallet's highest role",
        parameters: [ADDRESS_PARAM],
        responses: {
          200: {
            description: "Role",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    address: { type: "string" },
                    role: { type: "string", enum: ["OWNER", "MODERATOR", "REGULAR_USER", "NONE"] },
                  },
                },
              },
            },
          },
          400: { description: "Invalid address", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/roles/{address}/has/{role}": {
      get: {
        tags: ["Roles"],
        summary: "Check whether a wallet holds a specific role",
        parameters: [
          ADDRESS_PARAM,
          { name: "role", in: "path", required: true, schema: { type: "string", enum: ["OWNER", "MODERATOR", "REGULAR_USER"] } },
        ],
        responses: { 200: { description: "Boolean result" }, 400: { description: "Invalid input" } },
      },
    },
    "/api/v1/users": {
      get: {
        tags: ["Users"],
        summary: "List all users (admin)",
        description: "Role-gated on-chain (OWNER); requires the API key. Read-only, no gas.",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: { description: "User list", content: { "application/json": { schema: { type: "object", properties: { count: { type: "integer" }, users: { type: "array", items: { $ref: "#/components/schemas/User" } } } } } } },
          401: { description: "Missing/invalid API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          503: { description: "Operator not configured", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Register a user (grants REGULAR_USER)",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["address", "username"], properties: { address: { type: "string" }, username: { type: "string" } } } } },
        },
        responses: writeResponses,
      },
    },
    "/api/v1/users/count": {
      get: {
        tags: ["Users"],
        summary: "Total registered users (admin)",
        security: [{ ApiKeyAuth: [] }],
        responses: { 200: { description: "Count" }, 401: { description: "Missing/invalid API key" } },
      },
    },
    "/api/v1/users/{address}": {
      get: {
        tags: ["Users"],
        summary: "Get a user's public profile",
        parameters: [ADDRESS_PARAM],
        responses: {
          200: { description: "User", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          404: { description: "Not registered", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Remove a user (deactivate + revoke roles)",
        security: [{ ApiKeyAuth: [] }],
        parameters: [ADDRESS_PARAM],
        responses: writeResponses,
      },
    },
    "/api/v1/users/{address}/active": {
      get: {
        tags: ["Users"],
        summary: "Get a user's active status",
        parameters: [ADDRESS_PARAM],
        responses: { 200: { description: "Active flag" }, 400: { description: "Invalid address" } },
      },
    },
    "/api/v1/users/{address}/deactivate": {
      post: {
        tags: ["Users"],
        summary: "Deactivate a user (moderator action)",
        security: [{ ApiKeyAuth: [] }],
        parameters: [ADDRESS_PARAM],
        responses: writeResponses,
      },
    },
    "/api/v1/users/{address}/reactivate": {
      post: {
        tags: ["Users"],
        summary: "Reactivate a user (moderator action)",
        security: [{ ApiKeyAuth: [] }],
        parameters: [ADDRESS_PARAM],
        responses: writeResponses,
      },
    },
    "/api/v1/moderators": {
      post: {
        tags: ["Moderators"],
        summary: "Promote an address to moderator",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["address", "username"], properties: { address: { type: "string" }, username: { type: "string" } } } } },
        },
        responses: writeResponses,
      },
    },
    "/api/v1/settings/{key}": {
      get: {
        tags: ["Settings"],
        summary: "Read a system setting",
        parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Key/value" } },
      },
      put: {
        tags: ["Settings"],
        summary: "Create/update a system setting (owner action)",
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { value: { type: "string" } } } } } },
        responses: writeResponses,
      },
    },
    "/api/v1/keys": {
      post: {
        tags: ["API keys"],
        summary: "Mint a new API key (admin only)",
        description:
          "Issues a stateless HMAC-signed key. Requires the `x-admin-secret` header — not an API key. " +
          "The key is returned once and is never stored server-side.",
        parameters: [
          { name: "x-admin-secret", in: "header", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Supervisor" },
                  scope: { type: "string", enum: ["read", "write"], default: "read" },
                  days: { type: "integer", default: 30, description: "0 = never expires" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Key issued (shown once)" },
          401: { description: "Invalid admin secret" },
          503: { description: "Key issuance not enabled" },
        },
      },
    },
    "/api/v1/keys/me": {
      get: {
        tags: ["API keys"],
        summary: "Inspect the API key you are sending",
        description: "Returns the key's name, scope and expiry. Useful to confirm what a key can do.",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: { description: "Key details" },
          401: { description: "Missing, invalid, revoked or expired key" },
        },
      },
    },
    "/api/v1/assistant": {
      post: {
        tags: ["Assistant"],
        summary: "Ask the documentation assistant a question",
        description:
          "AI assistant grounded in this API's documentation. No API key required. " +
          "Rate limited to 12 requests/minute per IP.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["question"],
                properties: {
                  question: { type: "string", example: "How do I check a wallet's role?" },
                  history: {
                    type: "array",
                    description: "Optional prior turns for follow-up questions.",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string", enum: ["user", "model"] },
                        text: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Answer" },
          400: { description: "Missing or oversized question" },
          429: { description: "Rate limited" },
          503: { description: "Assistant not enabled on this instance" },
        },
      },
    },
    "/api/v1/content/approve": {
      post: {
        tags: ["Content"],
        summary: "Approve user content (moderator action)",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["address", "contentId"], properties: { address: { type: "string" }, contentId: { type: "string" } } } } },
        },
        responses: writeResponses,
      },
    },
  },
};
