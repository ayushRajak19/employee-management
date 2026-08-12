import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedOrganization } from "./seedSuperAdmin.js";

const run = async (): Promise<void> => {
  await connectDatabase();
  try {
    await seedOrganization();
  } finally {
    await disconnectDatabase();
  }
};

void run().catch((error: unknown) => {
  console.error("Organization seed failed", error);
  process.exit(1);
});
