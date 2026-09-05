import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const EMAIL_ENROLLMENT_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "STOPPED", "FAILED"] as const;
export interface EmailEnrollmentDocument {
  workflow: Types.ObjectId;
  contact: Types.ObjectId;
  step: number;
  status: typeof EMAIL_ENROLLMENT_STATUSES[number];
  nextRunAt: Date;
  lockedAt?: Date;
  lastError?: string;
  attempts: number;
}
const schema = new Schema<EmailEnrollmentDocument>({
  workflow: { type: Schema.Types.ObjectId, ref: "EmailWorkflow", required: true, index: true },
  contact: { type: Schema.Types.ObjectId, ref: "VendorContact", required: true, index: true },
  step: { type: Number, min: 0, max: 1, default: 0 },
  status: { type: String, enum: EMAIL_ENROLLMENT_STATUSES, default: "PENDING", index: true },
  nextRunAt: { type: Date, required: true, index: true },
  lockedAt: Date,
  lastError: { type: String, maxlength: 1000 },
  attempts: { type: Number, min: 0, default: 0 },
}, { timestamps: true });
schema.index({ workflow: 1, contact: 1 }, { unique: true });
schema.index({ status: 1, nextRunAt: 1 });
export const EmailEnrollment = tenantModel<EmailEnrollmentDocument>("EmailEnrollment", schema);
