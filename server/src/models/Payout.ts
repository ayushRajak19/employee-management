import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";
import type { CalculationAuditBreakdown } from "../services/salesMath.js";

export interface CompensationPeriodDocument {
  periodType: "MONTHLY" | "QUARTERLY" | "YEARLY";
  periodStart: Date;
  periodEnd: Date;
  status: "OPEN" | "CLOSED";
  closedAt?: Date;
  closedBy?: Types.ObjectId;
}

const periodSchema = new Schema<CompensationPeriodDocument>({
  periodType: { type: String, enum: ["MONTHLY", "QUARTERLY", "YEARLY"], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN", index: true },
  closedAt: Date,
  closedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
periodSchema.index({ periodType: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

export interface PayoutDocument {
  employeeId: Types.ObjectId;
  targetId: Types.ObjectId;
  periodId: Types.ObjectId;
  ruleVersion: number;
  targetAmount: number;
  achievedAmount: number;
  achievementPercentage: number;
  breakdown: CalculationAuditBreakdown;
  isLocked: true;
}
const payoutSchema = new Schema<PayoutDocument>({
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  targetId: { type: Schema.Types.ObjectId, ref: "SalesTarget", required: true },
  periodId: { type: Schema.Types.ObjectId, ref: "CompensationPeriod", required: true, index: true },
  ruleVersion: { type: Number, required: true, min: 1 },
  targetAmount: { type: Number, required: true, min: 0 },
  achievedAmount: { type: Number, required: true, min: 0 },
  achievementPercentage: { type: Number, required: true, min: 0 },
  breakdown: { type: Schema.Types.Mixed, required: true },
  isLocked: { type: Boolean, required: true, default: true, immutable: true },
}, { timestamps: true });
payoutSchema.index({ employeeId: 1, targetId: 1, periodId: 1 }, { unique: true });
const rejectMutation = () => { throw new Error("Locked payouts are immutable"); };
payoutSchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"], rejectMutation);

export const CompensationPeriod = tenantModel<CompensationPeriodDocument>("CompensationPeriod", periodSchema);
export const Payout = tenantModel<PayoutDocument>("Payout", payoutSchema);
