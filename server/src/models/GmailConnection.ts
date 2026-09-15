import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

interface GmailConnectionDocument {
  key: string;
  email: string;
  refreshTokenEncrypted: string;
  connectedBy: Types.ObjectId;
  connectedAt: Date;
  needsReconnect: boolean;
  sendDay?: string;
  sendCount: number;
}
const schema = new Schema<GmailConnectionDocument>({
  key: { type: String, default: "gmail", unique: true },
  email: { type: String, required: true, lowercase: true },
  refreshTokenEncrypted: { type: String, required: true, select: false },
  connectedBy: { type: Schema.Types.ObjectId, required: true },
  connectedAt: { type: Date, required: true },
  needsReconnect: { type: Boolean, default: false },
  sendDay: String,
  sendCount: { type: Number, default: 0 },
}, { timestamps: true });
export const GmailConnection = tenantModel<GmailConnectionDocument>("GmailConnection", schema);
