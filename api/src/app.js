"use strict";
const path = require("path");
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

  // --- Landing page: premium styled documentation guide ---
  const guidePath = path.join(__dirname, "..", "public", "guide.html");
  app.get("/", (req, res) => res.sendFile(guidePath));

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

module.exports = { buildApp };
