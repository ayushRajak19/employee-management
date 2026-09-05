import { Schema, model, type Types } from "mongoose";

export const TENANT_STATUSES = ["PROVISIONING", "ACTIVE", "SUSPENDED"] as const;
export type TenantStatus = typeof TENANT_STATUSES[number];

export interface TenantDocument {
  name: string;
  slug: string;
  status: TenantStatus;
  plan: "STANDARD" | "ENTERPRISE";
  createdBy?: Types.ObjectId;
  activatedAt?: Date;
}

const schema = new Schema<TenantDocument>({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/ },
  status: { type: String, enum: TENANT_STATUSES, default: "PROVISIONING", index: true },
  plan: { type: String, enum: ["STANDARD", "ENTERPRISE"], default: "STANDARD" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  activatedAt: Date,
}, { timestamps: true });

schema.index({ status: 1, createdAt: -1 });
export const Tenant = model<TenantDocument>("Tenant", schema);

