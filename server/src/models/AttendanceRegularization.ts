import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const REGULARIZATION_REASONS = [
  "CLIENT_MEETING",
  "TRANSIT_DELAY",
  "TECHNICAL_ISSUE",
  "WORK_TRAVEL",
  "EMERGENCY",
  "OTHER"
] as const;

export interface AttendanceRegularizationDocument {
  employee: Types.ObjectId;
  department: Types.ObjectId;
  dateKey: string;
  originalStatus: "LATE" | "HALF_DAY" | "ABSENT";
  requestedStatus: "PRESENT";
  reason: typeof REGULARIZATION_REASONS[number];
  note: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: Types.ObjectId;
  reviewComment?: string;
  reviewedAt?: Date;
  isActive: boolean;
}

const schema = new Schema<AttendanceRegularizationDocument>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    originalStatus: { type: String, enum: ["LATE", "HALF_DAY", "ABSENT"], required: true },
    requestedStatus: { type: String, enum: ["PRESENT"], default: "PRESENT" },
    reason: { type: String, enum: REGULARIZATION_REASONS, required: true },
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewComment: { type: String, trim: true, maxlength: 1000 },
    reviewedAt: Date,
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

schema.index({ employee: 1, dateKey: 1, status: 1 });
schema.index({ department: 1, status: 1, createdAt: -1 });

export const AttendanceRegularization = tenantModel<AttendanceRegularizationDocument>(
  "AttendanceRegularization",
  schema
);
