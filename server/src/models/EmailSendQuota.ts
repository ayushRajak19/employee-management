import { Schema, model } from "mongoose";

interface EmailSendQuotaDocument { _id: string; used: number }

const schema = new Schema<EmailSendQuotaDocument>({
  _id: { type: String, required: true },
  used: { type: Number, required: true, min: 0, default: 0 },
}, { timestamps: true });

export const EmailSendQuota = model<EmailSendQuotaDocument>("EmailSendQuota", schema);
