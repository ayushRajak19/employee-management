import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";
export interface RefreshSessionDocument { user: Types.ObjectId; tokenHash: string; family: string; expiresAt: Date; revokedAt?: Date; replacedByHash?: string; ip?: string; userAgent?: string }
const schema = new Schema<RefreshSessionDocument>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true }, family: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, revokedAt: Date,
  replacedByHash: String, ip: { type: String, maxlength: 100 }, userAgent: { type: String, maxlength: 500 }
}, { timestamps: true });
export const RefreshSession = tenantModel<RefreshSessionDocument>("RefreshSession", schema);
