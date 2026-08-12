import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

const start = async (): Promise<void> => {
  const server = createServer(createApp());
  server.listen(env.PORT, () => console.log(`MobiusBloom Employee listening on port ${env.PORT}`));
  let databaseRetry: NodeJS.Timeout | undefined;
  const connectWithRetry = async (): Promise<void> => {
    try {
      await connectDatabase();
      console.log("MongoDB connected");
    } catch (error: unknown) {
      console.error("MongoDB connection failed; retrying in 15 seconds", error);
      databaseRetry = setTimeout(() => void connectWithRetry(), 15_000);
      databaseRetry.unref();
    }
  };
  void connectWithRetry();
  const shutdown = (signal: string) => { console.log(`${signal} received; shutting down`); if (databaseRetry) clearTimeout(databaseRetry); server.close(() => { void disconnectDatabase().finally(() => process.exit(0)); }); setTimeout(() => process.exit(1), 10_000).unref(); };
  process.on("SIGTERM", () => shutdown("SIGTERM")); process.on("SIGINT", () => shutdown("SIGINT"));
};

void start().catch((error: unknown) => {
  console.error("MobiusBloom Employee failed to start", error);
  process.exit(1);
});
