import path from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { verifyRequestOrigin } from "./middleware/security.js";
import { apiRouter } from "./routes/index.js";

export const createApp = () => {
  const app = express(); app.set("trust proxy", 1); app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false }));
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(compression()); app.use(express.json({ limit: "1mb" })); app.use(express.urlencoded({ extended: false, limit: "1mb" })); app.use(cookieParser());
  app.use(verifyRequestOrigin);
  app.use("/api", rateLimit({ windowMs: 60_000, limit: 200, standardHeaders: "draft-7", legacyHeaders: false, skip: (request) => request.path === "/v1/email-automation/webhooks/brevo" }));
  app.get("/api/health", (_request, response) => {
    const databaseConnected = mongoose.connection.readyState === 1;
    response.status(databaseConnected ? 200 : 503).json({
      success: databaseConnected,
      message: databaseConnected ? "MobiusEMS API is healthy" : "API is running but MongoDB is unavailable",
      database: databaseConnected ? "connected" : "disconnected"
    });
  });
  app.use("/api/v1", apiRouter);
  app.use("/api", notFound);
  if (env.NODE_ENV === "production") {
    const dirname = path.dirname(fileURLToPath(import.meta.url)); const clientDist = path.resolve(dirname, "../../client/dist");
    app.use(express.static(clientDist, { index: false, maxAge: "1y", immutable: true }));
    app.get("*", (_request, response) => response.sendFile(path.join(clientDist, "index.html")));
  } else app.use(notFound);
  app.use(errorHandler); return app;
};

