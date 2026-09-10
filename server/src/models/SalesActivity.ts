import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const SALES_ACTIVITY_TYPES = [
  "NOTE",
  "CALL_LOG",
  "STAGE_CHANGE",
  "STATUS_CHANGE",
  "LOCATION_PIN",
  "CONVERSION",
] as const;

export interface SalesActivityDocument {
  entityType: "leads" | "customers" | "opportunities";
  entityId: Types.ObjectId;
  type: typeof SALES_ACTIVITY_TYPES[number];
  content: string;
  metadata?: Record<string, unknown>;
  performedBy?: Types.ObjectId;
  performedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<SalesActivityDocument>(
  {
    entityType: { type: String, enum: ["leads", "customers", "opportunities"], required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, enum: SALES_ACTIVITY_TYPES, required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    metadata: { type: Schema.Types.Mixed },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    performedByName: { type: String, trim: true, maxlength: 120 },
  },
  { timestamps: true },
);

schema.index({ entityId: 1, createdAt: -1 });

export const SalesActivity = tenantModel<SalesActivityDocument>("SalesActivity", schema);
