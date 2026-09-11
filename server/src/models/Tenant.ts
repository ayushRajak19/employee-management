import { Schema, model, type Types } from "mongoose";

export const TENANT_STATUSES = ["PROVISIONING", "ACTIVE", "SUSPENDED"] as const;
export type TenantStatus = typeof TENANT_STATUSES[number];

export interface TenantDocument {
  name: string;
  slug: string;
  industry?: string;
  companySize?: string;
  country?: string;
  website?: string;
  referralSource?: string;
  primaryUseCase?: string;
  status: TenantStatus;
  plan: "STANDARD" | "ENTERPRISE";
  createdBy?: Types.ObjectId;
  activatedAt?: Date;
}

const schema = new Schema<TenantDocument>({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/ },
  industry: { type: String, trim: true, maxlength: 80 },
  companySize: { type: String, enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] },
  country: { type: String, trim: true, maxlength: 80 },
  website: { type: String, trim: true, maxlength: 200 },
  referralSource: { type: String, trim: true, maxlength: 80 },
  primaryUseCase: { type: String, trim: true, maxlength: 120 },
  status: { type: String, enum: TENANT_STATUSES, default: "PROVISIONING", index: true },
  plan: { type: String, enum: ["STANDARD", "ENTERPRISE"], default: "STANDARD" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  activatedAt: Date,
}, { timestamps: true });

schema.index({ status: 1, createdAt: -1 });
export const Tenant = model<TenantDocument>("Tenant", schema);
