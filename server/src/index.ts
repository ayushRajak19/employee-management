import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

const start = async (): Promise<void> => {
  await connectDatabase();
  const server = createServer(createApp());
  server.listen(env.PORT, () => console.log(`MobiusBloom Employee listening on port ${env.PORT}`));
  const shutdown = (signal: string) => { console.log(`${signal} received; shutting down`); server.close(() => { void disconnectDatabase().finally(() => process.exit(0)); }); setTimeout(() => process.exit(1), 10_000).unref(); };
  process.on("SIGTERM", () => shutdown("SIGTERM")); process.on("SIGINT", () => shutdown("SIGINT"));
};

void start().catch((error: unknown) => {
  console.error("MobiusBloom Employee failed to start", error);
  process.exit(1);
});
