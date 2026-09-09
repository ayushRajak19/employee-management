import assert from "node:assert/strict";
import test from "node:test";
import { ROLE_PERMISSIONS, type SessionUser } from "@mobius-ems/shared";
import { Types } from "mongoose";
import { getEmployeeMapColor } from "./employeeMapService.js";
import { expectedGeoParentType } from "./geoService.js";
import { canTransitionLeadStatus, canTransitionOpportunityStatus, salesPopulationPaths } from "./salesDataService.js";
import { effectivePeriodsOverlap } from "./salesTerritoryService.js";
import { assertSalesEmployeeScope, assertSalesTerritoryScope, salesScopeLevelForPermissions } from "./salesScopeService.js";
import { assignmentSchema, createOpportunitySchema, createRevenueSchema, createTargetSchema, updateLeadSchema } from "../validators/salesValidators.js";

const id = () => new Types.ObjectId();
test("conversion accepts an edited confirmed sale value and rejects invalid money", () => {
  const parse = (saleAmount: unknown) => updateLeadSchema.safeParse({ params: { id: id().toString() }, body: { status: "CONVERTED", saleAmount } });
  const result = parse(12500.50);
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.body.saleAmount, 12500.50);
  assert.equal(parse(-1).success, false);
  assert.equal(parse(Infinity).success, false);
});
const scope = (level: "SELF" | "TEAM" | "ALL", employeeIds: Types.ObjectId[], territoryIds: Types.ObjectId[]) => ({ level, allowedEmployeeIds: employeeIds, allowedTerritoryIds: territoryIds, allowedGeoIds: [] });

test("sales lists populate only fields defined by each entity", () => {
  assert.equal(salesPopulationPaths.leads.includes(" employee"), false);
  assert.ok(salesPopulationPaths.leads.includes("customer"));
  assert.equal(salesPopulationPaths.targets.includes("ownerEmployee"), false);
  assert.equal(salesPopulationPaths.targets, "employee territory");
  assert.equal(salesPopulationPaths.revenue, "employee territory geoNode customer channelPartner sourceOpportunity");
  assert.ok(salesPopulationPaths.opportunities.includes("customer"));
  assert.ok(salesPopulationPaths.customers.includes("sourceLead"));
});

test("Sales Agent resolves to SELF and cannot request another employee", () => {
  assert.equal(salesScopeLevelForPermissions(["sales.analytics.self"]), "SELF");
  const own = id(); const other = id(); const resolved = scope("SELF", [own], []);
  assert.doesNotThrow(() => assertSalesEmployeeScope(resolved, own.toString()));
  assert.throws(() => assertSalesEmployeeScope(resolved, other.toString()), /outside your authorized scope/);
});

test("Sales Manager resolves to TEAM and remains limited to resolved employees and territories", () => {
  assert.equal(salesScopeLevelForPermissions(["sales.analytics.self", "sales.analytics.team"]), "TEAM");
  const employee = id(); const territory = id(); const resolved = scope("TEAM", [employee], [territory]);
  assert.doesNotThrow(() => assertSalesEmployeeScope(resolved, employee.toString()));
  assert.throws(() => assertSalesTerritoryScope(resolved, id().toString()), /outside your authorized scope/);
  assert.ok(ROLE_PERMISSIONS.MANAGER.includes("sales.territory.manage"));
  assert.ok(ROLE_PERMISSIONS.MANAGER.includes("sales.target.manage"));
});

test("HR receives read-only all-sales analytics permissions", () => {
  const permissions = ROLE_PERMISSIONS.HR_ADMIN;
  assert.equal(salesScopeLevelForPermissions(permissions), "ALL");
  assert.ok(permissions.includes("sales.analytics.all"));
  assert.ok(!permissions.includes("sales.territory.manage"));
  assert.ok(!permissions.includes("sales.target.manage"));
  assert.ok(!permissions.includes("sales.revenue.manage"));
});

test("Super Admin receives tenant-wide sales actions", () => {
  assert.equal(salesScopeLevelForPermissions(ROLE_PERMISSIONS.SUPER_ADMIN), "ALL");
  assert.ok(ROLE_PERMISSIONS.SUPER_ADMIN.includes("sales.configuration.manage"));
  assert.ok(ROLE_PERMISSIONS.SUPER_ADMIN.includes("sales.revenue.manage"));
});

test("Sales employees can create their own geography, territory, and channel partner records", () => {
  assert.ok(ROLE_PERMISSIONS.EMPLOYEE.includes("sales.geography.create.self"));
  assert.ok(ROLE_PERMISSIONS.EMPLOYEE.includes("sales.territory.create.self"));
  assert.ok(ROLE_PERMISSIONS.EMPLOYEE.includes("sales.channel_partner.manage.self"));
  assert.ok(ROLE_PERMISSIONS.EMPLOYEE.includes("sales.lead.manage.self"));
  assert.ok(ROLE_PERMISSIONS.EMPLOYEE.includes("sales.customer.manage.self"));
});

test("lead lifecycle moves forward and converted or lost leads are terminal", () => {
  assert.equal(canTransitionLeadStatus("NEW", "CONTACTED"), true);
  assert.equal(canTransitionLeadStatus("NEW", "CONVERTED"), true);
  assert.equal(canTransitionLeadStatus("QUALIFIED", "CONVERTED"), true);
  assert.equal(canTransitionLeadStatus("QUALIFIED", "CONTACTED"), false);
  assert.equal(canTransitionLeadStatus("CONVERTED", "NEW"), false);
  assert.equal(canTransitionLeadStatus("LOST", "QUALIFIED"), false);
});

test("opportunity lifecycle closes once and cannot be reopened", () => {
  assert.equal(canTransitionOpportunityStatus("OPEN", "WON"), true);
  assert.equal(canTransitionOpportunityStatus("OPEN", "LOST"), true);
  assert.equal(canTransitionOpportunityStatus("WON", "OPEN"), false);
  assert.equal(canTransitionOpportunityStatus("LOST", "WON"), false);
});

test("employees without a sales permission have no sales scope", () => {
  assert.equal(salesScopeLevelForPermissions(["employee.view"]), null);
});

test("geography hierarchy follows Global through Area and stays separate from territory", () => {
  assert.equal(expectedGeoParentType("COUNTRY"), "GLOBAL");
  assert.equal(expectedGeoParentType("STATE"), "COUNTRY");
  assert.equal(expectedGeoParentType("DISTRICT"), "STATE");
  assert.equal(expectedGeoParentType("CITY"), "DISTRICT");
  assert.equal(expectedGeoParentType("AREA"), "CITY");
  assert.equal(expectedGeoParentType("GLOBAL"), undefined);
});

test("effective-dated assignments preserve adjacent history and reject overlap", () => {
  const january = new Date("2026-01-01"); const june = new Date("2026-06-30"); const july = new Date("2026-07-01");
  assert.equal(effectivePeriodsOverlap(january, june, july, undefined), false);
  assert.equal(effectivePeriodsOverlap(january, july, july, undefined), true);
});

test("sales validation rejects negative money and invalid probability", () => {
  const common = { name: "Deal", ownerEmployee: id().toString(), territory: id().toString(), stage: "Qualified", currency: "INR" };
  assert.equal(createOpportunitySchema.safeParse({ body: { ...common, estimatedValue: -1, probability: 50 } }).success, false);
  assert.equal(createOpportunitySchema.safeParse({ body: { ...common, estimatedValue: 100, probability: 101 } }).success, false);
  assert.equal(createRevenueSchema.safeParse({ body: { employee: id().toString(), territory: id().toString(), amount: -1, currency: "INR", transactionDate: new Date(), source: "invoice" } }).success, false);
  assert.equal(updateLeadSchema.safeParse({ params: { id: id().toString() }, body: {} }).success, false);
  assert.equal(updateLeadSchema.safeParse({ params: { id: id().toString() }, body: { status: "LOST", lostReason: "No budget" } }).success, true);
});

test("target validation requires ownership and a valid period", () => {
  const base = { periodType: "MONTHLY", revenueTarget: 1000, currency: "INR" };
  assert.equal(createTargetSchema.safeParse({ body: { ...base, periodStart: "2026-02-01", periodEnd: "2026-01-01" } }).success, false);
  assert.equal(createTargetSchema.safeParse({ body: { ...base, employee: id().toString(), periodStart: "2026-01-01", periodEnd: "2026-01-31" } }).success, true);
});

test("assignment validation rejects inverted effective dates", () => {
  assert.equal(assignmentSchema.safeParse({ body: { employee: id().toString(), territory: id().toString(), assignmentRole: "MEMBER", effectiveFrom: "2026-02-01", effectiveTo: "2026-01-01" } }).success, false);
});

test("employee map color is stable and derived without stored random state", () => {
  const employee = id().toString();
  assert.equal(getEmployeeMapColor(employee), getEmployeeMapColor(employee));
  assert.match(getEmployeeMapColor(employee), /^#[0-9a-f]{6}$/i);
});

test("session capability remains independent from role permission", () => {
  const viewer = { capabilities: [], permissions: ["sales.analytics.self"] } as Pick<SessionUser, "capabilities" | "permissions">;
  assert.equal(viewer.capabilities.includes("SALES_MODULE"), false);
  assert.equal(salesScopeLevelForPermissions(viewer.permissions), "SELF");
});
