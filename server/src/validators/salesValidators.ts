import { z } from "zod";
import { ASSIGNMENT_ROLES } from "../models/EmployeeTerritoryAssignment.js";
import { GEO_NODE_TYPES } from "../models/GeoNode.js";
import { LEAD_STATUSES } from "../models/SalesLead.js";
import { TERRITORY_STATUSES } from "../models/SalesTerritory.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const currency = z.string().trim().length(3).transform((value) => value.toUpperCase());
const nonNegative = z.coerce.number().finite().min(0);
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional();
const phone = z.string().trim().min(5).max(40).regex(/^[+()\-\s\d]+$/, "Invalid phone number").optional();
const coordinates = z.object({
  type: z.literal("Point").default("Point"),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});
const validEffectiveRange = (value: { effectiveFrom?: Date; effectiveTo?: Date }) => !value.effectiveFrom || !value.effectiveTo || value.effectiveTo >= value.effectiveFrom;
const idParams = z.object({ params: z.object({ id: objectId }) });
export const salesIdSchema = idParams;
export const employeeAnalyticsSchema = z.object({ params: z.object({ employeeId: objectId }) });
export const geoIdSchema = z.object({ params: z.object({ geoId: objectId }) });
export const territoryIdSchema = z.object({ params: z.object({ territoryId: objectId }) });

const geoBody = z.object({
  name: z.string().trim().min(1).max(160),
  code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  type: z.enum(GEO_NODE_TYPES),
  parent: objectId.optional(),
  location: coordinates.optional(),
  boundary: z.object({ type: z.enum(["Polygon", "MultiPolygon"]), coordinates: z.array(z.unknown()) }).optional(),
});
export const createGeoSchema = z.object({ body: geoBody });
export const updateGeoSchema = z.object({ params: z.object({ geoId: objectId }), body: geoBody.partial().refine((body) => Object.keys(body).length > 0, "At least one field is required") });

const coverageRules = z.object({
  geoNodeIds: z.array(objectId).max(500).default([]),
  pincodes: z.array(z.string().trim().min(1).max(20)).max(500).default([]),
  productIds: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  channels: z.array(z.string().trim().min(1).max(80)).max(100).default([]),
  industries: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  customerTypes: z.array(z.string().trim().min(1).max(80)).max(100).default([]),
  namedAccountIds: z.array(objectId).max(500).default([]),
});
const territoryBase = z.object({
  name: z.string().trim().min(1).max(160),
  code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  parentTerritory: objectId.optional(),
  status: z.enum(TERRITORY_STATUSES).default("ACTIVE"),
  ownerEmployee: objectId.optional(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
  coverageRules: coverageRules.default({}),
});
const territoryBody = territoryBase.refine(validEffectiveRange, { message: "Effective end must be after start", path: ["effectiveTo"] });
export const createTerritorySchema = z.object({ body: territoryBody });
export const updateTerritorySchema = z.object({ params: z.object({ territoryId: objectId }), body: territoryBase.partial().refine(validEffectiveRange, { message: "Effective end must be after start", path: ["effectiveTo"] }).refine((body) => Object.keys(body).length > 0, "At least one field is required") });
const assignmentBody = z.object({
  employee: objectId,
  territory: objectId,
  assignmentRole: z.enum(ASSIGNMENT_ROLES),
  primary: z.boolean().default(false),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
  leadCapacityPerMonth: z.coerce.number().int().min(1).optional(),
}).refine(validEffectiveRange, { message: "Effective end must be after start", path: ["effectiveTo"] });
export const assignmentSchema = z.object({ body: assignmentBody });

const ownerAndLocation = {
  ownerEmployee: objectId.optional(),
  territory: objectId.optional(),
  geoNode: objectId.optional(),
  coordinates: coordinates.optional(),
  market: z.string().trim().max(120).optional(),
};
export const leadBody = z.object({
  name: z.string().trim().min(1).max(160), ...ownerAndLocation,
  companyName: z.string().trim().min(1).max(160).optional(), email, phone, notes: z.string().trim().max(2000).optional(),
  status: z.enum(LEAD_STATUSES).default("NEW"), source: z.string().trim().max(120).optional(),
  estimatedValue: nonNegative.default(0), currency: currency.default("INR"),
  lostReason: z.string().trim().min(1).max(500).optional(),
  firstResponseAt: z.coerce.date().optional(), qualifiedAt: z.coerce.date().optional(),
  convertedAt: z.coerce.date().optional(), customer: objectId.optional(),
});
export const customerBody = z.object({
  name: z.string().trim().min(1).max(160), ...ownerAndLocation,
  primaryContactName: z.string().trim().min(1).max(160).optional(), email, phone,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"), customerType: z.string().trim().max(80).optional(),
  lifetimeRevenue: nonNegative.default(0), currency: currency.default("INR"), lastOrderDate: z.coerce.date().optional(),
});
export const opportunityBody = z.object({
  name: z.string().trim().min(1).max(160), lead: objectId.optional(), customer: objectId.optional(), ...ownerAndLocation,
  stage: z.string().trim().min(1).max(80), estimatedValue: nonNegative, currency: currency.default("INR"),
  probability: z.coerce.number().finite().min(0).max(100), expectedCloseDate: z.coerce.date().optional(),
  actualCloseDate: z.coerce.date().optional(), status: z.enum(["OPEN", "WON", "LOST"]).default("OPEN"),
  lostReason: z.string().trim().max(500).optional(),
});
const targetCompensationSchema = z.object({
  commissionRate: z.coerce.number().min(0).max(100).default(0),
  bonusThresholdPercentage: z.coerce.number().min(0).max(500).optional(),
  bonusRate: z.coerce.number().min(0).max(100).optional(),
  basePayAllocation: nonNegative.optional(),
  currency: currency.optional(),
  ruleName: z.string().trim().max(120).optional(),
});

const targetBase = z.object({
  territory: objectId.optional(),
  employee: objectId.optional(),
  periodType: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  revenueTarget: nonNegative,
  currency,
  leadTarget: nonNegative.optional(),
  conversionTarget: z.coerce.number().min(0).max(100).optional(),
  customerAcquisitionTarget: nonNegative.optional(),
  justification: z.string().trim().min(10, "Explain the business basis for this target").max(2000).default("Management-assigned target; business basis recorded in the approved sales plan."),
  status: z.enum(["DRAFT", "ACTIVE", "SUPERSEDED", "CLOSED"]).default("ACTIVE"),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional(),
  changeReason: z.string().trim().max(1000).optional(),
  compensationRule: targetCompensationSchema.optional(),
});
export const targetBody = targetBase.refine((body) => body.employee || body.territory, { message: "Target requires an employee or territory" })
  .refine((body) => body.periodEnd >= body.periodStart, { message: "Period end must be after start", path: ["periodEnd"] })
  .refine(validEffectiveRange, { message: "Effective end must be after start", path: ["effectiveTo"] });
export const revenueBody = z.object({
  customer: objectId.optional(), employee: objectId.optional(), territory: objectId.optional(), geoNode: objectId.optional(),
  amount: nonNegative, currency, transactionDate: z.coerce.date(), source: z.string().trim().min(1).max(80),
  reference: z.string().trim().max(160).optional(), productId: z.string().trim().max(120).optional(), channelPartner: objectId.optional(),
});
const channelPartnerBase = z.object({
  name: z.string().trim().min(1).max(160), code: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  type: z.enum(["DISTRIBUTOR", "DEALER", "RESELLER", "RETAILER", "SERVICE_PARTNER", "OTHER"]),
  contactName: z.string().trim().min(1).max(160).optional(), email, phone, market: z.string().trim().max(120).optional(),
  territory: objectId.optional(), ownerEmployee: objectId.optional(), geoNode: objectId.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"), effectiveFrom: z.coerce.date(), effectiveTo: z.coerce.date().optional(),
});
export const channelPartnerBody = channelPartnerBase.refine(validEffectiveRange, { message: "Effective end must be after start", path: ["effectiveTo"] });

export const createLeadSchema = z.object({ body: leadBody });
export const createCustomerSchema = z.object({ body: customerBody });
export const createOpportunitySchema = z.object({ body: opportunityBody });
export const createTargetSchema = z.object({ body: targetBody });
export const createRevenueSchema = z.object({ body: revenueBody });
export const createChannelPartnerSchema = z.object({ body: channelPartnerBody });
const atLeastOneField = <T extends Record<string, unknown>>(body: T) => Object.keys(body).length > 0;
export const updateLeadSchema = z.object({ params: z.object({ id: objectId }), body: leadBody.partial().extend({ saleAmount: nonNegative.optional() }).refine(atLeastOneField, "At least one field is required") });
export const updateCustomerSchema = z.object({ params: z.object({ id: objectId }), body: customerBody.partial().refine(atLeastOneField, "At least one field is required") });
export const updateOpportunitySchema = z.object({ params: z.object({ id: objectId }), body: opportunityBody.partial().refine(atLeastOneField, "At least one field is required") });
export const updateTargetSchema = z.object({
  params: z.object({ id: objectId }),
  body: targetBase.partial()
    .refine((body) => !body.periodStart || !body.periodEnd || body.periodEnd >= body.periodStart, { message: "Period end must be after start", path: ["periodEnd"] })
    .refine(validEffectiveRange, { message: "Effective end must be after start", path: ["effectiveTo"] }),
});
export const updateRevenueSchema = z.object({ params: z.object({ id: objectId }), body: revenueBody.partial().refine(atLeastOneField, "At least one field is required") });
export const updateChannelPartnerSchema = z.object({ params: z.object({ id: objectId }), body: channelPartnerBase.partial().refine(validEffectiveRange, { message: "Effective end must be after start", path: ["effectiveTo"] }).refine(atLeastOneField, "At least one field is required") });

export const configurationSchema = z.object({ body: z.object({
  defaultLeadCapacityPerEmployee: z.coerce.number().int().min(1),
  responseSlaMinutes: z.coerce.number().int().min(1),
  healthyConversionRate: z.coerce.number().min(0).max(100),
  opportunityWeights: z.object({
    demand: nonNegative, coverageGap: nonNegative, customerWhiteSpace: nonNegative,
    pipelinePotential: nonNegative, growth: nonNegative, conversionPotential: nonNegative,
  }).refine((weights) => Object.values(weights).some((weight) => weight > 0), "At least one opportunity weight must be positive"),
  targetReminderFrequencyDays: z.coerce.number().int().min(1).max(90).optional(),
  milestones: z.array(z.coerce.number().min(1).max(100)).max(10).optional(),
  nearDeadlineDays: z.coerce.number().int().min(1).max(30).optional(),
  automaticRemindersEnabled: z.boolean().optional(),
}) });
