import type { SessionUser } from "@mobius-ems/shared";
import type { Model } from "mongoose";
import { ChannelPartner } from "../models/ChannelPartner.js";
import { Employee } from "../models/Employee.js";
import { GeoNode } from "../models/GeoNode.js";
import { SalesCustomer } from "../models/SalesCustomer.js";
import { LEAD_STATUSES, SalesLead } from "../models/SalesLead.js";
import { SalesOpportunity } from "../models/SalesOpportunity.js";
import { SalesRevenueTransaction } from "../models/SalesRevenueTransaction.js";
import { SalesTarget } from "../models/SalesTarget.js";
import { SalesTerritory } from "../models/SalesTerritory.js";
import { AppError } from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";
import {
  assertSalesEmployeeScope,
  assertSalesTerritoryScope,
  resolveSalesScope,
  type ResolvedSalesScope,
} from "./salesScopeService.js";

export type SalesEntityName = "leads" | "customers" | "opportunities" | "targets" | "revenue" | "channelPartners";
type SalesInput = Record<string, unknown> & { ownerEmployee?: string; employee?: string; territory?: string; geoNode?: string };
type LeadStatus = typeof LEAD_STATUSES[number];

const leadTransitions: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ["CONTACTED", "QUALIFIED", "CONVERTED", "LOST"],
  CONTACTED: ["QUALIFIED", "CONVERTED", "LOST"],
  QUALIFIED: ["CONVERTED", "LOST"],
  CONVERTED: [],
  LOST: [],
};
export const canTransitionLeadStatus = (from: LeadStatus, to: LeadStatus) => from === to || leadTransitions[from].includes(to);

export const salesPopulationPaths: Record<SalesEntityName, string> = {
  leads: "ownerEmployee territory geoNode",
  customers: "ownerEmployee territory geoNode",
  opportunities: "ownerEmployee territory geoNode",
  targets: "employee territory",
  revenue: "employee territory geoNode",
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

const scopeFilter = (scope: ResolvedSalesScope, entity: SalesEntityName): Record<string, unknown> => {
  if (entity === "targets") {
    return { $or: [
      { employee: { $in: scope.allowedEmployeeIds } },
      { territory: { $in: scope.allowedTerritoryIds } },
    ] };
  }
  if (entity === "channelPartners") return {
    territory: { $in: scope.allowedTerritoryIds },
    ...(scope.level === "SELF" && scope.employeeId ? { ownerEmployee: scope.employeeId } : {}),
  };
  const employeeField = entity === "revenue" ? "employee" : "ownerEmployee";
  return {
    [employeeField]: { $in: scope.allowedEmployeeIds },
    territory: { $in: scope.allowedTerritoryIds },
  };
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
  if (input.geoNode && !await GeoNode.exists({ _id: input.geoNode, isActive: true })) throw new AppError("Geography not found", 404);
  if (typeof input.customer === "string" && !await SalesCustomer.exists({ _id: input.customer, ...scopeFilter(scope, "customers") })) throw new AppError("Customer not found", 404);
  if (typeof input.lead === "string" && !await SalesLead.exists({ _id: input.lead, ...scopeFilter(scope, "leads") })) throw new AppError("Lead not found", 404);
  if (typeof input.channelPartner === "string" && !await ChannelPartner.exists({ _id: input.channelPartner, ...scopeFilter(scope, "channelPartners") })) throw new AppError("Channel partner not found", 404);
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
  if (!["targets", "channelPartners"].includes(entity) && !input[employeeKey]) throw new AppError("Employee is required", 422);
  await validateReferences(scope, input);
  const item = await modelFor(entity).create(input);
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
  if (entity === "leads" && typeof input.status === "string") {
    const previousStatus = item.get("status") as LeadStatus;
    const nextStatus = input.status as LeadStatus;
    if (!canTransitionLeadStatus(previousStatus, nextStatus)) throw new AppError(`Lead cannot move from ${previousStatus} to ${nextStatus}`, 409, "INVALID_LEAD_TRANSITION");
  }
  if (scope.level === "SELF") {
    const employeeKey = entity === "targets" || entity === "revenue" ? "employee" : "ownerEmployee";
    if (input[employeeKey]) input[employeeKey] = scope.employeeId;
  }
  await validateReferences(scope, input);
  const previous = item.toObject();
  let convertedCustomer;
  if (entity === "leads" && input.status === "CONVERTED" && !item.get("customer")) {
    convertedCustomer = await SalesCustomer.findOneAndUpdate(
      { sourceLead: item._id },
      { $setOnInsert: {
        name: item.get("name"),
        sourceLead: item._id,
        ownerEmployee: item.get("ownerEmployee"),
        territory: item.get("territory"),
        geoNode: item.get("geoNode"),
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
