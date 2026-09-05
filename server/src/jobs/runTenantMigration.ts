import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { createDatabaseBackup } from "./backupDatabase.js";
import { seedOrganization } from "./seedSuperAdmin.js";

const run = async (): Promise<void> => {
  const backupDirectory = await createDatabaseBackup(process.argv[2]);
  console.log(`Pre-migration backup completed: ${backupDirectory}`);
  const { defaultTenantId } = await connectDatabase({ migrateTenants: true });
  try {
    // Reconnect after index reconciliation so seeding never reuses a connection
    // affected by a long-running index command.
    await disconnectDatabase();
    await connectDatabase();
    await seedOrganization(defaultTenantId);
    console.log("Tenant migration completed successfully");
  } finally {
    await disconnectDatabase();
  }
};

void run().catch((error: unknown) => {
  console.error("Tenant migration failed; the pre-migration backup was retained", error);
  process.exit(1);
});
