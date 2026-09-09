import type { SessionUser } from "@mobius-ems/shared";
import { SalesConfiguration, type SalesConfigurationDocument } from "../models/SalesConfiguration.js";
import { writeAudit } from "./auditService.js";

export const defaultSalesConfiguration = {
  key: "DEFAULT" as const,
  defaultLeadCapacityPerEmployee: 300,
  responseSlaMinutes: 240,
  healthyConversionRate: 15,
  opportunityWeights: {
    demand: 20,
    coverageGap: 25,
    customerWhiteSpace: 15,
    pipelinePotential: 15,
    growth: 10,
    conversionPotential: 15,
  },
};

export const getSalesConfiguration = async () => (await SalesConfiguration.findOne({ key: "DEFAULT" }).lean()) ?? defaultSalesConfiguration;

export const updateSalesConfiguration = async (viewer: SessionUser, input: Omit<SalesConfigurationDocument, "key">) => {
  const previous = await SalesConfiguration.findOne({ key: "DEFAULT" }).lean();
  const item = await SalesConfiguration.findOneAndUpdate(
    { key: "DEFAULT" },
    { $set: input, $setOnInsert: { key: "DEFAULT" } },
    { upsert: true, new: true, runValidators: true },
  );
  await writeAudit({ user: viewer.id, action: "SALES_CONFIGURATION_UPDATED", entityType: "SalesConfiguration", entityId: item.id, oldValue: previous, newValue: input });
  return item;
};
