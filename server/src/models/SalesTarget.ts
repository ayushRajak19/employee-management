import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface TargetCompensationRule {
  ruleType?: "PROPORTIONAL" | "COMMISSION_SLABS" | "FLAT_COMMISSION" | "HYBRID";
  commissionRate?: number;
  bonusThresholdPercentage?: number;
  bonusRate?: number;
  basePayAllocation?: number;
  currency?: string;
  ruleName?: string;
  proportionalConfig?: { maxPayout: number; baselineTarget?: number };
  slabs?: { fromPercentage: number; toPercentage: number | null; rate: number; rateType: "PERCENTAGE" | "FIXED" }[];
  floorPercentage?: number;
  capAmount?: number;
  capPercentage?: number;
  accelerators?: { thresholdPercentage: number; multiplier: number }[];
}

export type TargetStatus = "DRAFT" | "ACTIVE" | "SUPERSEDED" | "CLOSED";

export interface SalesTargetDocument {
  targetGroupId?: string;
  version: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isLatest: boolean;
  territory?: Types.ObjectId;
  employee?: Types.ObjectId;
  periodType: "MONTHLY" | "QUARTERLY" | "YEARLY";
  periodStart: Date;
  periodEnd: Date;
  revenueTarget: number;
  currency: string;
  leadTarget?: number;
  conversionTarget?: number;
  customerAcquisitionTarget?: number;
  status: TargetStatus;
  justification: string;
  assignedBy?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  changeReason?: string;
  compensationRule?: TargetCompensationRule;
}

const compensationRuleSchema = new Schema<TargetCompensationRule>(
  {
    ruleType: { type: String, enum: ["PROPORTIONAL", "COMMISSION_SLABS", "FLAT_COMMISSION", "HYBRID"], default: "FLAT_COMMISSION" },
    commissionRate: { type: Number, min: 0, max: 100, default: 0 },
    bonusThresholdPercentage: { type: Number, min: 0, max: 500 },
    bonusRate: { type: Number, min: 0, max: 100 },
    basePayAllocation: { type: Number, min: 0 },
    currency: { type: String, uppercase: true, trim: true, maxlength: 3 },
    ruleName: { type: String, trim: true, maxlength: 120 },
    proportionalConfig: { maxPayout: { type: Number, min: 0 }, baselineTarget: { type: Number, min: 0 } },
    slabs: [{ _id: false, fromPercentage: { type: Number, required: true, min: 0 }, toPercentage: { type: Number, min: 0, default: null }, rate: { type: Number, required: true, min: 0 }, rateType: { type: String, enum: ["PERCENTAGE", "FIXED"], default: "PERCENTAGE" } }],
    floorPercentage: { type: Number, min: 0, max: 500 },
    capAmount: { type: Number, min: 0 },
    capPercentage: { type: Number, min: 0, max: 500 },
    accelerators: [{ _id: false, thresholdPercentage: { type: Number, required: true, min: 0, max: 500 }, multiplier: { type: Number, required: true, min: 1 } }],
  },
  { _id: false },
);

const schema = new Schema<SalesTargetDocument>(
  {
    targetGroupId: { type: String, index: true },
    version: { type: Number, required: true, default: 1, min: 1 },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date },
    isLatest: { type: Boolean, default: true, index: true },
    territory: { type: Schema.Types.ObjectId, ref: "SalesTerritory", index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", index: true },
    periodType: { type: String, enum: ["MONTHLY", "QUARTERLY", "YEARLY"], required: true },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true },
    revenueTarget: { type: Number, required: true, min: 0 },
    currency: { type: String, uppercase: true, trim: true, maxlength: 3, required: true },
    leadTarget: { type: Number, min: 0 },
    conversionTarget: { type: Number, min: 0, max: 100 },
    customerAcquisitionTarget: { type: Number, min: 0 },
    status: { type: String, enum: ["DRAFT", "ACTIVE", "SUPERSEDED", "CLOSED"], default: "ACTIVE", index: true },
    justification: { type: String, required: true, trim: true, maxlength: 2000 },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    changeReason: { type: String, trim: true, maxlength: 1000 },
    compensationRule: { type: compensationRuleSchema },
  },
  { timestamps: true },
);

schema.pre("validate", function () {
  if (!this.employee && !this.territory) {
    this.invalidate("employee", "Target requires an employee or territory");
  }
  if (this.periodEnd < this.periodStart) {
    this.invalidate("periodEnd", "Period end must be after period start");
  }
  if (this.effectiveTo && this.effectiveFrom && this.effectiveTo < this.effectiveFrom) {
    this.invalidate("effectiveTo", "Effective end must be after effective start");
  }
  if (!this.effectiveFrom && this.periodStart) {
    this.effectiveFrom = this.periodStart;
  }
  if (!this.targetGroupId && this._id) {
    this.targetGroupId = this._id.toString();
  }
});

schema.index({ targetGroupId: 1, version: 1 });
schema.index({ employee: 1, isLatest: 1, status: 1 });
schema.index({ employee: 1, periodStart: 1, periodEnd: 1 });
schema.index({ territory: 1, periodStart: 1, periodEnd: 1 });

export const SalesTarget = tenantModel<SalesTargetDocument>("SalesTarget", schema);
