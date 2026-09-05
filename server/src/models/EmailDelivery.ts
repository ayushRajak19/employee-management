import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface EmailDeliveryDocument {
  workflow?: Types.ObjectId;
  contact?: Types.ObjectId;
  enrollment?: Types.ObjectId;
  recipientEmail: string;
  providerMessageId: string;
  step: number;
  subject: string;
  status: string;
  lastEventAt: Date;
  events: { type: string; occurredAt: Date; reason?: string }[];
}
const schema = new Schema<EmailDeliveryDocument>({
  workflow: { type: Schema.Types.ObjectId, ref: "EmailWorkflow", index: true },
  contact: { type: Schema.Types.ObjectId, ref: "VendorContact", index: true },
  enrollment: { type: Schema.Types.ObjectId, ref: "EmailEnrollment", index: true },
  recipientEmail: { type: String, required: true, lowercase: true, index: true },
  providerMessageId: { type: String, required: true, unique: true, index: true },
  step: { type: Number, required: true },
  subject: { type: String, required: true },
  status: { type: String, required: true, default: "REQUESTED", index: true },
  lastEventAt: { type: Date, required: true, default: Date.now },
  events: [{ _id: false, type: { type: String, required: true }, occurredAt: { type: Date, required: true }, reason: String }],
}, { timestamps: true });
export const EmailDelivery = tenantModel<EmailDeliveryDocument>("EmailDelivery", schema);
