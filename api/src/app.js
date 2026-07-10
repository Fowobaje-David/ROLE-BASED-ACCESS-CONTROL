"use strict";
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const config = require("./config");
const openapiSpec = require("./openapi");
const { ApiError } = require("./middleware/errors");

const systemRoutes = require("./routes/system");
const rolesRoutes = require("./routes/roles");
const usersRoutes = require("./routes/users");
const moderatorsRoutes = require("./routes/moderators");
const settingsRoutes = require("./routes/settings");
const contentRoutes = require("./routes/content");

function buildApp() {
  const app = express();
  app.set("trust proxy", 1);

  // Security headers (relax CSP so Swagger UI assets load).
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false })
  );
  app.use(
    cors({
      origin: config.CORS_ORIGINS === "*" ? true : config.CORS_ORIGINS.split(","),
    })
  );
  app.use(express.json({ limit: "64kb" }));
  app.use(morgan("tiny"));

  // Basic rate limit to keep a public host healthy.
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: "rate_limited", message: "Too many requests, slow down." } },
    })
  );

  // --- Docs / reference ---
  app.get("/openapi.json", (req, res) => res.json(openapiSpec));
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      customSiteTitle: "AdminPanel API — Reference",
      swaggerOptions: { persistAuthorization: true },
    })
  );

  // --- Landing page ---
  app.get("/", (req, res) => {
    res.type("html").send(landingHtml());
  });

  // --- API ---
  app.use("/", systemRoutes); // /health, /api/v1/tx/:hash
  app.use("/api/v1/roles", rolesRoutes);
  app.use("/api/v1/users", usersRoutes);
  app.use("/api/v1/moderators", moderatorsRoutes);
  app.use("/api/v1/settings", settingsRoutes);
  app.use("/api/v1/content", contentRoutes);

  // 404
  app.use((req, res) => {
    res.status(404).json({
      error: { code: "not_found", message: `No route for ${req.method} ${req.path}. See /docs.` },
    });
  });

  // Central error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }
    if (err && err.type === "entity.parse.failed") {
      return res.status(400).json({ error: { code: "bad_json", message: "Request body is not valid JSON." } });
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ error: { code: "internal_error", message: "Something went wrong." } });
  });

  return app;
}

function landingHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>AdminPanel API</title>
<style>
:root{color-scheme:light dark}
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:6vh auto;padding:0 20px;line-height:1.6}
h1{margin-bottom:0}.sub{color:#64748b;margin-top:4px}
code{background:#0f172a12;padding:2px 6px;border-radius:6px}
a.btn{display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;margin:8px 8px 0 0}
.grid{margin-top:24px}.row{padding:8px 0;border-top:1px solid #e2e8f0}
.m{font-weight:700;color:#7c3aed}.pill{font-size:12px;background:#7c3aed18;color:#7c3aed;border-radius:999px;padding:2px 8px;margin-left:6px}
</style></head><body>
<h1>AdminPanel API</h1>
<p class="sub">REST interface to a role-based access-control smart contract on Ethereum Sepolia.</p>
<p>
  <a class="btn" href="/docs">Interactive API reference →</a>
  <a class="btn" style="background:#334155" href="/openapi.json">OpenAPI spec</a>
  <a class="btn" style="background:#334155" href="/health">Health</a>
</p>
<div class="grid">
  <div class="row"><span class="m">GET</span> <code>/api/v1/roles/{address}</code> — a wallet's role</div>
  <div class="row"><span class="m">GET</span> <code>/api/v1/users/{address}</code> — a user's profile</div>
  <div class="row"><span class="m">GET</span> <code>/api/v1/settings/{key}</code> — a system setting</div>
  <div class="row"><span class="m">POST</span> <code>/api/v1/users</code> <span class="pill">API key</span> — register a user</div>
  <div class="row"><span class="m">POST</span> <code>/api/v1/moderators</code> <span class="pill">API key</span> — promote a moderator</div>
</div>
<p class="sub" style="margin-top:24px">Contract: <code>${config.CONTRACT_ADDRESS}</code> · Chain ID ${config.CHAIN_ID}</p>
</body></html>`;
}

module.exports = { buildApp };
