"use strict";
// Serverless entry for Vercel. Vercel routes all requests here (see vercel.json)
// and invokes the exported Express app as the handler.
const { buildApp } = require("../src/app");
module.exports = buildApp();
