import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export type CompensationRuleStatus = "DRAFT" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";

export interface CompensationRuleDocument {
  ruleCode: string;
  name: string;
  ruleGroupId?: string;
  version: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isLatest: boolean;
  status: CompensationRuleStatus;
  commissionRate: number;
  bonusThresholdPercentage?: number;
  bonusRate?: number;
  basePayAllocation?: number;
  currency: string;
  description?: string;
  ruleType: "PROPORTIONAL" | "COMMISSION_SLABS" | "FLAT_COMMISSION" | "TARGET_GATE" | "HYBRID";
  proportionalConfig?: { maxPayout: number; baselineTarget?: number };
  slabs?: { fromPercentage: number; toPercentage: number | null; rate: number; rateType: "PERCENTAGE" | "FIXED" }[];
  floorPercentage?: number;
  capAmount?: number;
  capPercentage?: number;
  accelerators?: { thresholdPercentage: number; multiplier: number }[];
  createdBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
}

const schema = new Schema<CompensationRuleDocument>(
  {
    ruleCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    ruleGroupId: { type: String, index: true },
    version: { type: Number, required: true, default: 1, min: 1 },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date },
    isLatest: { type: Boolean, default: true, index: true },
    status: { type: String, enum: ["DRAFT", "ACTIVE", "SUPERSEDED", "ARCHIVED"], default: "ACTIVE", index: true },
    commissionRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
    bonusThresholdPercentage: { type: Number, min: 0, max: 500 },
    bonusRate: { type: Number, min: 0, max: 100 },
    basePayAllocation: { type: Number, min: 0 },
    currency: { type: String, uppercase: true, trim: true, maxlength: 3, default: "INR" },
    description: { type: String, trim: true, maxlength: 2000 },
    ruleType: { type: String, enum: ["PROPORTIONAL", "COMMISSION_SLABS", "FLAT_COMMISSION", "TARGET_GATE", "HYBRID"], default: "FLAT_COMMISSION" },
    proportionalConfig: { maxPayout: { type: Number, min: 0 }, baselineTarget: { type: Number, min: 0 } },
    slabs: [{ _id: false, fromPercentage: { type: Number, required: true, min: 0 }, toPercentage: { type: Number, min: 0, default: null }, rate: { type: Number, required: true, min: 0 }, rateType: { type: String, enum: ["PERCENTAGE", "FIXED"], default: "PERCENTAGE" } }],
    floorPercentage: { type: Number, min: 0, max: 500 },
    capAmount: { type: Number, min: 0 },
    capPercentage: { type: Number, min: 0, max: 500 },
    accelerators: [{ _id: false, thresholdPercentage: { type: Number, required: true, min: 0, max: 500 }, multiplier: { type: Number, required: true, min: 1 } }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
  },
  { timestamps: true },
);

schema.pre("validate", function () {
  if (!this.ruleGroupId && this._id) {
    this.ruleGroupId = this._id.toString();
  }
  if (this.effectiveTo && this.effectiveTo < this.effectiveFrom) {
    this.invalidate("effectiveTo", "Effective end must be after effective start");
  }
});

schema.index({ ruleCode: 1, version: 1 });
schema.index({ ruleGroupId: 1, version: 1 });

export const CompensationRule = tenantModel<CompensationRuleDocument>("CompensationRule", schema);
