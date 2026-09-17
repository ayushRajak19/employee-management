import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PLAN_CONFIGS, PLAN_TIERS } from "@mobius-ems/shared";
import type { Request, Response } from "express";
import { requireActiveSubscription, requireFeature } from "../middleware/subscriptionGuard.js";
import { createTenantSchema, updateTenantSubscriptionSchema } from "../validators/tenantValidators.js";
import { AppError } from "../utils/AppError.js";

test("commercial plan tiers expose expected feature configs and defaults", () => {
  for (const tier of PLAN_TIERS) {
    const config = DEFAULT_PLAN_CONFIGS[tier];
    assert.ok(config, `Default configuration must exist for ${tier}`);
    assert.ok(typeof config.maxEmployees === "number" && config.maxEmployees >= 0);
    assert.equal(typeof config.features.aiEnabled, "boolean");
    assert.equal(typeof config.features.salesModuleEnabled, "boolean");
    assert.equal(typeof config.features.emailAutomationEnabled, "boolean");
  }

  // STARTER plan is lean and low-cost
  assert.equal(DEFAULT_PLAN_CONFIGS.STARTER.maxEmployees, 15);
  assert.equal(DEFAULT_PLAN_CONFIGS.STARTER.features.aiEnabled, false);
  assert.equal(DEFAULT_PLAN_CONFIGS.STARTER.features.salesModuleEnabled, false);

  // STANDARD plan includes AI assistant and core features
  assert.equal(DEFAULT_PLAN_CONFIGS.STANDARD.maxEmployees, 50);
  assert.equal(DEFAULT_PLAN_CONFIGS.STANDARD.features.aiEnabled, true);
  assert.equal(DEFAULT_PLAN_CONFIGS.STANDARD.features.salesModuleEnabled, false);

  // PROFESSIONAL includes Sales CRM and email automation
  assert.equal(DEFAULT_PLAN_CONFIGS.PROFESSIONAL.maxEmployees, 150);
  assert.equal(DEFAULT_PLAN_CONFIGS.PROFESSIONAL.features.aiEnabled, true);
  assert.equal(DEFAULT_PLAN_CONFIGS.PROFESSIONAL.features.salesModuleEnabled, true);
  assert.equal(DEFAULT_PLAN_CONFIGS.PROFESSIONAL.features.emailAutomationEnabled, true);

  // ENTERPRISE includes all modules and unlimited quota (0)
  assert.equal(DEFAULT_PLAN_CONFIGS.ENTERPRISE.maxEmployees, 0);
  assert.equal(DEFAULT_PLAN_CONFIGS.ENTERPRISE.features.aiEnabled, true);
  assert.equal(DEFAULT_PLAN_CONFIGS.ENTERPRISE.features.customRolesEnabled, true);
});

test("tenant validators enforce valid commercial plan tiers and subscription updates", () => {
  // Valid plan tiers
  for (const plan of ["STARTER", "STANDARD", "PROFESSIONAL", "ENTERPRISE", "CUSTOM"]) {
    const parsed = createTenantSchema.safeParse({
      body: {
        name: "Acme Corp",
        plan,
        adminName: "Admin User",
        adminEmail: "admin@acme.test",
        temporaryPassword: "Password123!",
      },
    });
    assert.equal(parsed.success, true, `Plan ${plan} should be accepted`);
  }

  // Invalid plan tier
  const invalid = createTenantSchema.safeParse({
    body: {
      name: "Acme Corp",
      plan: "COMMUNITY_FREE",
      adminName: "Admin User",
      adminEmail: "admin@acme.test",
      temporaryPassword: "Password123!",
    },
  });
  assert.equal(invalid.success, false);

  // Subscription update schema
  const validSubUpdate = updateTenantSubscriptionSchema.safeParse({
    params: { id: "507f1f77bcf86cd799439011" },
    body: {
      plan: "PROFESSIONAL",
      subscriptionStatus: "ACTIVE",
      maxEmployees: 150,
      billingCycle: "ANNUAL",
      features: {
        aiEnabled: true,
      },
    },
  });
  assert.equal(validSubUpdate.success, true);
});

test("requireActiveSubscription permits reads but blocks mutations when subscription is EXPIRED or CANCELLED", () => {
  let nextCalledWith: unknown = null;
  const mockNext = (err?: unknown) => {
    nextCalledWith = err ?? null;
  };

  const dummyRes = {} as Response;

  // 1. ACTIVE tenant performing POST - allowed
  const activeReq = {
    method: "POST",
    user: { subscriptionStatus: "ACTIVE" },
  } as unknown as Request;
  nextCalledWith = null;
  requireActiveSubscription(activeReq, dummyRes, mockNext);
  assert.equal(nextCalledWith, null);

  // 2. EXPIRED tenant performing GET - allowed for read access
  const expiredGetReq = {
    method: "GET",
    user: { subscriptionStatus: "EXPIRED" },
  } as unknown as Request;
  nextCalledWith = null;
  requireActiveSubscription(expiredGetReq, dummyRes, mockNext);
  assert.equal(nextCalledWith, null);

  // 3. EXPIRED tenant performing POST - blocked with 402
  const expiredPostReq = {
    method: "POST",
    user: { subscriptionStatus: "EXPIRED" },
  } as unknown as Request;
  nextCalledWith = null;
  requireActiveSubscription(expiredPostReq, dummyRes, mockNext);
  assert.ok(nextCalledWith instanceof AppError);
  assert.equal((nextCalledWith as AppError).statusCode, 402);
  assert.equal((nextCalledWith as AppError).code, "SUBSCRIPTION_EXPIRED");

  // 4. CANCELLED tenant performing DELETE - blocked with 402
  const cancelledDelReq = {
    method: "DELETE",
    user: { subscriptionStatus: "CANCELLED" },
  } as unknown as Request;
  nextCalledWith = null;
  requireActiveSubscription(cancelledDelReq, dummyRes, mockNext);
  assert.ok(nextCalledWith instanceof AppError);
  assert.equal((nextCalledWith as AppError).statusCode, 402);
});

test("requireFeature blocks access when module feature is disabled in plan", () => {
  let nextCalledWith: unknown = null;
  const mockNext = (err?: unknown) => {
    nextCalledWith = err ?? null;
  };
  const dummyRes = {} as Response;

  const aiGuard = requireFeature("aiEnabled");

  // User without AI feature
  const userWithoutAi = {
    user: {
      plan: "STARTER",
      features: { aiEnabled: false },
    },
  } as unknown as Request;
  nextCalledWith = null;
  aiGuard(userWithoutAi, dummyRes, mockNext);
  assert.ok(nextCalledWith instanceof AppError);
  assert.equal((nextCalledWith as AppError).statusCode, 403);
  assert.equal((nextCalledWith as AppError).code, "FEATURE_NOT_IN_PLAN");

  // User with AI feature
  const userWithAi = {
    user: {
      plan: "PROFESSIONAL",
      features: { aiEnabled: true },
    },
  } as unknown as Request;
  nextCalledWith = null;
  aiGuard(userWithAi, dummyRes, mockNext);
  assert.equal(nextCalledWith, null);
});
