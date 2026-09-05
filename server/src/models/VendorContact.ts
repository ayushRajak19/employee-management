import { randomBytes } from "node:crypto";
import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const VENDOR_STATUSES = ["ACTIVE", "REPLIED", "UNSUBSCRIBED", "BOUNCED", "BLOCKED"] as const;
export interface VendorContactDocument {
  name: string;
  companyName: string;
  email: string;
  source: string;
  consentAt: Date;
  status: typeof VENDOR_STATUSES[number];
  repliedAt?: Date;
  unsubscribeToken: string;
  createdBy: Types.ObjectId;
}
const schema = new Schema<VendorContactDocument>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  companyName: { type: String, required: true, trim: true, maxlength: 160 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true, index: true },
  source: { type: String, required: true, trim: true, maxlength: 200 },
  consentAt: { type: Date, required: true },
  status: { type: String, enum: VENDOR_STATUSES, default: "ACTIVE", index: true },
  repliedAt: Date,
  unsubscribeToken: { type: String, required: true, unique: true, index: true, default: () => randomBytes(24).toString("hex"), select: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
export const VendorContact = tenantModel<VendorContactDocument>("VendorContact", schema);
