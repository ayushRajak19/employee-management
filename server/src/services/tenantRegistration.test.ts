import assert from "node:assert/strict";
import test from "node:test";
import { Tenant } from "../models/Tenant.js";
import { createTenant } from "./tenantService.js";

test("public registration cannot resume or overwrite any existing organization", async (t) => {
  const lookup = t.mock.method(Tenant, "findOne");
  for (const status of ["PROVISIONING", "ACTIVE", "SUSPENDED"]) {
    lookup.mock.mockImplementation((async () => ({ status })) as unknown as typeof Tenant.findOne);
    await assert.rejects(createTenant({ name: "Other organization", slug: "existing", plan: "STANDARD", adminName: "Other admin", adminEmail: "other@example.com", temporaryPassword: "Test-password-123" }), /already in use/);
  }
});
