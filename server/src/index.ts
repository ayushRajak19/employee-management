import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { seedOrganization } from "./jobs/seedSuperAdmin.js";
import { initializeEmailAutomation, runEmailAutomationCycle } from "./services/emailAutomationService.js";

const start = async (): Promise<void> => {
  // Do not accept traffic until tenant migration, indexes and baseline roles are ready.
  const { defaultTenantId } = await connectDatabase();
  console.log("MongoDB connected and tenant migration verified");
  await seedOrganization(defaultTenantId);

  const server = createServer(createApp());
  server.listen(env.PORT, () => console.log(`MobiusEMS listening on port ${env.PORT}`));
  void initializeEmailAutomation().catch((error: unknown) => console.error("Brevo email automation initialization failed", error));
  const automationTimer = setInterval(() => void runEmailAutomationCycle(), 60_000); automationTimer.unref();

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down`);
    clearInterval(automationTimer);
    server.close(() => { void disconnectDatabase().finally(() => process.exit(0)); });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

void start().catch((error: unknown) => {
  console.error("MobiusEMS failed to start", error);
  void disconnectDatabase().finally(() => process.exit(1));
});


