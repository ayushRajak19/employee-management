import { Schema } from "mongoose"; import { tenantModel } from "../tenancy/tenantModel.js";
export interface SalesConfigurationDocument {
  key: "DEFAULT";
  defaultLeadCapacityPerEmployee: number;
  responseSlaMinutes: number;
  healthyConversionRate: number;
  opportunityWeights: {
    demand: number;
    coverageGap: number;
    customerWhiteSpace: number;
    pipelinePotential: number;
    growth: number;
    conversionPotential: number;
  };
  targetReminderFrequencyDays: number;
  milestones: number[];
  nearDeadlineDays: number;
  automaticRemindersEnabled: boolean;
}

const schema = new Schema<SalesConfigurationDocument>({
  key: { type: String, enum: ["DEFAULT"], default: "DEFAULT", unique: true },
  defaultLeadCapacityPerEmployee: { type: Number, min: 1, default: 300 },
  responseSlaMinutes: { type: Number, min: 1, default: 240 },
  healthyConversionRate: { type: Number, min: 0, max: 100, default: 15 },
  opportunityWeights: {
    demand: { type: Number, min: 0, default: 20 },
    coverageGap: { type: Number, min: 0, default: 25 },
    customerWhiteSpace: { type: Number, min: 0, default: 15 },
    pipelinePotential: { type: Number, min: 0, default: 15 },
    growth: { type: Number, min: 0, default: 10 },
    conversionPotential: { type: Number, min: 0, default: 15 },
  },
  targetReminderFrequencyDays: { type: Number, min: 1, max: 90, default: 7 },
  milestones: { type: [Number], default: [50, 75, 90] },
  nearDeadlineDays: { type: Number, min: 1, max: 30, default: 3 },
  automaticRemindersEnabled: { type: Boolean, default: true },
}, { timestamps: true });
export const SalesConfiguration = tenantModel<SalesConfigurationDocument>("SalesConfiguration", schema);
