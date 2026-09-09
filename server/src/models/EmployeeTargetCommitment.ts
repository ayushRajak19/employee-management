import { Schema, Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface EmployeeTargetCommitmentDocument {
  employee: Types.ObjectId;
  target: Types.ObjectId;
  committedRevenue?: number;
  committedLeadCount?: number;
  committedCustomerCount?: number;
  note?: string;
  status: "SUBMITTED" | "APPROVED" | "REJECTED";
  version: number;
  submittedAt: Date;
}

const schema = new Schema<EmployeeTargetCommitmentDocument>({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  target: { type: Schema.Types.ObjectId, ref: "SalesTarget", required: true, index: true },
  committedRevenue: { type: Number, min: 0 },
  committedLeadCount: { type: Number, min: 0 },
  committedCustomerCount: { type: Number, min: 0 },
  note: { type: String, trim: true, maxlength: 2000 },
  status: { type: String, enum: ["SUBMITTED", "APPROVED", "REJECTED"], default: "SUBMITTED", index: true },
  version: { type: Number, required: true, min: 1 },
  submittedAt: { type: Date, default: Date.now, required: true },
}, { timestamps: true });

schema.index({ employee: 1, target: 1, version: 1 }, { unique: true });

export const EmployeeTargetCommitment = tenantModel<EmployeeTargetCommitmentDocument>("EmployeeTargetCommitment", schema);
