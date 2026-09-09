import type { SessionUser } from "@mobius-ems/shared";
import type { HydratedDocument, Model } from "mongoose";
import { ChannelPartner } from "../models/ChannelPartner.js";
import { Employee } from "../models/Employee.js";
import { EmployeeTerritoryAssignment } from "../models/EmployeeTerritoryAssignment.js";
import { GeoNode } from "../models/GeoNode.js";
import { SalesCustomer } from "../models/SalesCustomer.js";
import { LEAD_STATUSES, SalesLead } from "../models/SalesLead.js";
import { OPPORTUNITY_STATUSES, SalesOpportunity } from "../models/SalesOpportunity.js";
import { SalesRevenueTransaction } from "../models/SalesRevenueTransaction.js";
import { SalesTarget } from "../models/SalesTarget.js";
import { SalesTerritory } from "../models/SalesTerritory.js";
import { AppError } from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";
import {
  assertSalesEmployeeScope,
  assertSalesGeoScope,
  assertSalesTerritoryScope,
  resolveSalesScope,
  type ResolvedSalesScope,
} from "./salesScopeService.js";

export type SalesEntityName = "leads" | "customers" | "opportunities" | "targets" | "revenue" | "channelPartners";
type SalesInput = Record<string, unknown> & { ownerEmployee?: string; employee?: string; territory?: string; geoNode?: string; market?: string };
type LeadStatus = typeof LEAD_STATUSES[number];
type OpportunityStatus = typeof OPPORTUNITY_STATUSES[number];
type TargetStatus = "DRAFT" | "ACTIVE" | "CLOSED";

const leadTransitions: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ["CONTACTED", "QUALIFIED", "CONVERTED", "LOST"],
  CONTACTED: ["QUALIFIED", "CONVERTED", "LOST"],
  QUALIFIED: ["CONVERTED", "LOST"],
  CONVERTED: [],
  LOST: [],
};
export const canTransitionLeadStatus = (from: LeadStatus, to: LeadStatus) => from === to || leadTransitions[from].includes(to);
const opportunityTransitions: Record<OpportunityStatus, readonly OpportunityStatus[]> = {
  OPEN: ["WON", "LOST"],
  WON: [],
  LOST: [],
};
export const canTransitionOpportunityStatus = (from: OpportunityStatus, to: OpportunityStatus) => from === to || opportunityTransitions[from].includes(to);
const targetTransitions: Record<TargetStatus, readonly TargetStatus[]> = { DRAFT: ["ACTIVE"], ACTIVE: ["CLOSED"], CLOSED: [] };

export const salesPopulationPaths: Record<SalesEntityName, string> = {
  leads: "ownerEmployee territory geoNode customer",
  customers: "ownerEmployee territory geoNode sourceLead",
  opportunities: "ownerEmployee territory geoNode lead customer",
  targets: "employee territory",
  revenue: "employee territory geoNode customer channelPartner sourceOpportunity",
  channelPartners: "ownerEmployee territory geoNode",
};

const modelFor = (entity: SalesEntityName): Model<Record<string, unknown>> => {
  switch (entity) {
    case "leads": return SalesLead as unknown as Model<Record<string, unknown>>;
    case "customers": return SalesCustomer as unknown as Model<Record<string, unknown>>;
    case "opportunities": return SalesOpportunity as unknown as Model<Record<string, unknown>>;
    case "targets": return SalesTarget as unknown as Model<Record<string, unknown>>;
    case "revenue": return SalesRevenueTransaction as unknown as Model<Record<string, unknown>>;
    case "channelPartners": return ChannelPartner as unknown as Model<Record<string, unknown>>;
  }
};

const territoryVisibility = (scope: ResolvedSalesScope, ownerField?: string): Record<string, unknown> => {
  const clauses: Record<string, unknown>[] = [];
  if (scope.allowedTerritoryIds.length) clauses.push({ territory: { $in: scope.allowedTerritoryIds } });
  const unassigned: Record<string, unknown> = { territory: { $exists: false } };
  if (ownerField && scope.level !== "ALL") unassigned[ownerField] = { $in: scope.allowedEmployeeIds };
  clauses.push(unassigned);
  return { $or: clauses };
};

const scopeFilter = (scope: ResolvedSalesScope, entity: SalesEntityName): Record<string, unknown> => {
  if (entity === "targets") {
    return { $or: [
      { employee: { $in: scope.allowedEmployeeIds } },
      { territory: { $in: scope.allowedTerritoryIds } },
    ] };
  }
  if (entity === "channelPartners") return {
    ...territoryVisibility(scope, "ownerEmployee"),
    ...(scope.level === "SELF" && scope.employeeId ? { ownerEmployee: scope.employeeId } : {}),
  };
  const employeeField = entity === "revenue" ? "employee" : "ownerEmployee";
  return {
    [employeeField]: { $in: scope.allowedEmployeeIds },
    ...territoryVisibility(scope),
  };
};

const applyCustomerContext = async (scope: ResolvedSalesScope, entity: SalesEntityName, input: SalesInput) => {
  if (!["opportunities", "revenue"].includes(entity) || typeof input.customer !== "string") return;
  const customer = await SalesCustomer.findOne({ _id: input.customer, ...scopeFilter(scope, "customers") }).select("ownerEmployee territory geoNode market currency").lean();
  if (!customer) throw new AppError("Customer not found", 404);
  if (entity === "revenue") input.employee = customer.ownerEmployee.toString();
  else input.ownerEmployee = customer.ownerEmployee.toString();
  if (customer.territory) input.territory = customer.territory.toString();
  if (customer.geoNode) input.geoNode = customer.geoNode.toString();
  if (customer.market) input.market = customer.market;
  input.currency = customer.currency;
};

const applyTerritoryGeography = async (input: SalesInput) => {
  if (!input.territory || input.geoNode) return;
  const territory = await SalesTerritory.findById(input.territory).select("coverageRules.geoNodeIds").lean();
  const primaryGeo = territory?.coverageRules?.geoNodeIds?.[0];
  if (primaryGeo) input.geoNode = primaryGeo.toString();
};

const validateReferences = async (scope: ResolvedSalesScope, input: SalesInput): Promise<void> => {
  const employeeId = input.employee ?? input.ownerEmployee;
  if (employeeId) {
    assertSalesEmployeeScope(scope, employeeId);
    if (!await Employee.exists({ _id: employeeId, isActive: true })) throw new AppError("Employee not found", 404);
  }
  if (input.territory) {
    assertSalesTerritoryScope(scope, input.territory);
    if (!await SalesTerritory.exists({ _id: input.territory, status: { $ne: "INACTIVE" } })) throw new AppError("Territory not found", 404);
  }
  const now = new Date();
  if (employeeId && input.territory && !await EmployeeTerritoryAssignment.exists({
    employee: employeeId,
    territory: input.territory,
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: { $gte: now } }],
  })) throw new AppError("Assign the employee to this territory before creating the sales record", 422, "EMPLOYEE_TERRITORY_REQUIRED");
  if (input.geoNode) {
    assertSalesGeoScope(scope, input.geoNode);
    if (!await GeoNode.exists({ _id: input.geoNode, isActive: true })) throw new AppError("Geography not found", 404);
  }
  if (typeof input.customer === "string" && !await SalesCustomer.exists({ _id: input.customer, ...scopeFilter(scope, "customers") })) throw new AppError("Customer not found", 404);
  if (typeof input.lead === "string" && !await SalesLead.exists({ _id: input.lead, ...scopeFilter(scope, "leads") })) throw new AppError("Lead not found", 404);
  if (typeof input.channelPartner === "string" && !await ChannelPartner.exists({ _id: input.channelPartner, ...scopeFilter(scope, "channelPartners") })) throw new AppError("Channel partner not found", 404);
};

type SalesRecordDocument = HydratedDocument<Record<string, unknown>>;
const optionalId = (value: unknown) => value ? String(value) : undefined;
const mayAdjustRevenue = (viewer: SessionUser) => viewer.permissions.includes("sales.revenue.manage") || viewer.permissions.includes("sales.configuration.manage");

const adjustCustomerRevenue = async (customerId: string | undefined, amount: number, transactionDate?: Date) => {
  if (!customerId || !amount) return;
  await SalesCustomer.updateOne(
    { _id: customerId },
    {
      $inc: { lifetimeRevenue: amount },
      ...(amount > 0 && transactionDate ? { $max: { lastOrderDate: transactionDate } } : {}),
    },
  );
};

const createWonRevenue = async (viewer: SessionUser, opportunity: SalesRecordDocument) => {
  const customerId = optionalId(opportunity.get("customer"));
  if (!customerId) throw new AppError("Link a customer before marking an opportunity as won", 422, "OPPORTUNITY_CUSTOMER_REQUIRED");
  const transactionDate = (opportunity.get("actualCloseDate") as Date | undefined) ?? new Date();
  const amount = Number(opportunity.get("estimatedValue") ?? 0);
  const result = await SalesRevenueTransaction.updateOne(
    { sourceOpportunity: opportunity.get("_id") },
    { $setOnInsert: {
      sourceOpportunity: opportunity.get("_id"),
      customer: customerId,
      employee: opportunity.get("ownerEmployee"),
      ...(opportunity.get("territory") ? { territory: opportunity.get("territory") } : {}),
      geoNode: opportunity.get("geoNode"),
      market: opportunity.get("market"),
      amount,
      currency: opportunity.get("currency") ?? "INR",
      transactionDate,
      source: "OPPORTUNITY_WON",
      reference: `OPP-${opportunity.id}`,
    } },
    { upsert: true, runValidators: true },
  );
  if (!result.upsertedCount) return;
  await adjustCustomerRevenue(customerId, amount, transactionDate);
  await writeAudit({
    user: viewer.id,
    action: "SALES_REVENUE_AUTO_CREATED",
    entityType: "SalesRevenueTransaction",
    entityId: String(result.upsertedId),
    newValue: { sourceOpportunity: opportunity.id, customer: customerId, amount },
  });
};

export const listSalesData = async (viewer: SessionUser, entity: SalesEntityName) => {
  const scope = await resolveSalesScope(viewer);
  return modelFor(entity).find(scopeFilter(scope, entity)).populate(salesPopulationPaths[entity], "firstName lastName employeeId name code type").sort({ createdAt: -1 }).limit(500).lean();
};

export const listTerritorySalesData = async (viewer: SessionUser, entity: SalesEntityName, territoryId: string) => {
  const scope = await resolveSalesScope(viewer);
  assertSalesTerritoryScope(scope, territoryId);
  return modelFor(entity).find({ ...scopeFilter(scope, entity), territory: territoryId }).populate(salesPopulationPaths[entity], "firstName lastName employeeId name code type").sort({ createdAt: -1 }).limit(500).lean();
};

export const createSalesData = async (viewer: SessionUser, entity: SalesEntityName, raw: SalesInput) => {
  const scope = await resolveSalesScope(viewer);
  const input = { ...raw };
  const employeeKey = entity === "targets" || entity === "revenue" ? "employee" : "ownerEmployee";
  if (scope.level === "SELF" && entity !== "channelPartners") input[employeeKey] = scope.employeeId;
  if (scope.level === "SELF" && entity === "channelPartners") input.ownerEmployee = scope.employeeId;
  if (entity === "leads") {
    input.status = "NEW";
    delete input.customer;
    delete input.firstResponseAt;
    delete input.qualifiedAt;
    delete input.convertedAt;
    delete input.lostReason;
  }
  if (entity === "customers" && !mayAdjustRevenue(viewer)) input.lifetimeRevenue = 0;
  if (entity === "opportunities") {
    input.status = "OPEN";
    delete input.actualCloseDate;
    delete input.lostReason;
  }
  await applyCustomerContext(scope, entity, input);
  await applyTerritoryGeography(input);
  if (!["targets", "channelPartners"].includes(entity) && !input[employeeKey]) throw new AppError("Employee is required", 422);
  await validateReferences(scope, input);
  const item = await modelFor(entity).create(input);
  if (entity === "revenue") {
    await adjustCustomerRevenue(optionalId(item.get("customer")), Number(item.get("amount") ?? 0), item.get("transactionDate") as Date | undefined);
  }
  await writeAudit({
    user: viewer.id,
    action: `SALES_${entity.toUpperCase()}_CREATED`,
    entityType: modelFor(entity).modelName,
    entityId: item.id,
    newValue: input,
  });
  return item;
};

export const updateSalesData = async (viewer: SessionUser, entity: SalesEntityName, id: string, raw: SalesInput) => {
  const scope = await resolveSalesScope(viewer);
  const model = modelFor(entity);
  const item = await model.findOne({ _id: id, ...scopeFilter(scope, entity) });
  if (!item) throw new AppError("Sales record not found", 404);
  const input = { ...raw };
  const previous = item.toObject();
  if (entity === "opportunities" && item.get("status") !== "OPEN") {
    const fields = Object.keys(input);
    const isIdempotentStatusRetry = fields.length === 1 && input.status === item.get("status");
    if (!isIdempotentStatusRetry) throw new AppError("Closed opportunities cannot be edited", 409, "OPPORTUNITY_CLOSED");
  }
  if (entity === "leads") {
    delete input.customer;
    delete input.convertedAt;
    delete input.firstResponseAt;
    delete input.qualifiedAt;
  }
  if (entity === "leads" && typeof input.status === "string") {
    const previousStatus = item.get("status") as LeadStatus;
    const nextStatus = input.status as LeadStatus;
    if (!canTransitionLeadStatus(previousStatus, nextStatus)) throw new AppError(`Lead cannot move from ${previousStatus} to ${nextStatus}`, 409, "INVALID_LEAD_TRANSITION");
    if (nextStatus === "LOST" && !input.lostReason && !item.get("lostReason")) throw new AppError("A lost reason is required", 422, "LOST_REASON_REQUIRED");
    if (["CONTACTED", "QUALIFIED", "CONVERTED"].includes(nextStatus) && !item.get("firstResponseAt")) input.firstResponseAt = new Date();
    if (["QUALIFIED", "CONVERTED"].includes(nextStatus) && !item.get("qualifiedAt")) input.qualifiedAt = new Date();
  }
  if (entity === "customers" && !mayAdjustRevenue(viewer)) delete input.lifetimeRevenue;
  if (entity === "targets" && typeof input.status === "string") {
    const previousStatus = item.get("status") as TargetStatus;
    const nextStatus = input.status as TargetStatus;
    if (previousStatus !== nextStatus && !targetTransitions[previousStatus].includes(nextStatus)) throw new AppError(`Target cannot move from ${previousStatus} to ${nextStatus}`, 409, "INVALID_TARGET_TRANSITION");
  }
  if (entity === "opportunities" && typeof input.status === "string") {
    const previousStatus = item.get("status") as OpportunityStatus;
    const nextStatus = input.status as OpportunityStatus;
    if (!canTransitionOpportunityStatus(previousStatus, nextStatus)) throw new AppError(`Opportunity cannot move from ${previousStatus} to ${nextStatus}`, 409, "INVALID_OPPORTUNITY_TRANSITION");
    if (nextStatus === "LOST" && !input.lostReason && !item.get("lostReason")) throw new AppError("A lost reason is required", 422, "LOST_REASON_REQUIRED");
    if (nextStatus === "WON" && !(input.customer ?? item.get("customer"))) throw new AppError("Link a customer before marking an opportunity as won", 422, "OPPORTUNITY_CUSTOMER_REQUIRED");
    if (nextStatus === "WON") input.probability = 100;
    if (nextStatus === "LOST") input.probability = 0;
    if (["WON", "LOST"].includes(nextStatus) && !item.get("actualCloseDate")) input.actualCloseDate = new Date();
  }
  if (entity === "opportunities" && input.status === "OPEN") {
    delete input.actualCloseDate;
    delete input.lostReason;
  }
  if (scope.level === "SELF") {
    const employeeKey = entity === "targets" || entity === "revenue" ? "employee" : "ownerEmployee";
    if (input[employeeKey]) input[employeeKey] = scope.employeeId;
  }
  await applyCustomerContext(scope, entity, input);
  await applyTerritoryGeography(input);
  await validateReferences(scope, input);
  let convertedCustomer;
  if (entity === "leads" && input.status === "CONVERTED" && !item.get("customer")) {
    convertedCustomer = await SalesCustomer.findOneAndUpdate(
      { sourceLead: item._id },
      { $setOnInsert: {
        name: item.get("companyName") || item.get("name"),
        primaryContactName: item.get("name"),
        email: item.get("email"),
        phone: item.get("phone"),
        sourceLead: item._id,
        ownerEmployee: item.get("ownerEmployee"),
        ...(item.get("territory") ? { territory: item.get("territory") } : {}),
        geoNode: item.get("geoNode"),
        market: item.get("market"),
        coordinates: item.get("coordinates"),
        status: "ACTIVE",
        customerType: "CONVERTED_LEAD",
        lifetimeRevenue: 0,
        currency: item.get("currency") ?? "INR",
      } },
      { upsert: true, new: true, runValidators: true },
    );
    input.customer = convertedCustomer._id;
    input.convertedAt = new Date();
  }
  item.set(input);
  await item.save();
  if (entity === "opportunities" && input.status === "WON") await createWonRevenue(viewer, item);
  if (entity === "revenue") {
    const previousCustomer = optionalId(previous.customer);
    const nextCustomer = optionalId(item.get("customer"));
    const previousAmount = Number(previous.amount ?? 0);
    const nextAmount = Number(item.get("amount") ?? 0);
    if (previousCustomer === nextCustomer) {
      await adjustCustomerRevenue(nextCustomer, nextAmount - previousAmount, item.get("transactionDate") as Date | undefined);
    } else {
      await adjustCustomerRevenue(previousCustomer, -previousAmount);
      await adjustCustomerRevenue(nextCustomer, nextAmount, item.get("transactionDate") as Date | undefined);
    }
  }
  if (convertedCustomer) await writeAudit({ user: viewer.id, action: "SALES_CUSTOMER_AUTO_CREATED", entityType: "SalesCustomer", entityId: convertedCustomer.id, newValue: { sourceLead: item.id } });
  await writeAudit({
    user: viewer.id,
    action: `SALES_${entity.toUpperCase()}_UPDATED`,
    entityType: model.modelName,
    entityId: item.id,
    oldValue: previous,
    newValue: input,
  });
  return item;
};
