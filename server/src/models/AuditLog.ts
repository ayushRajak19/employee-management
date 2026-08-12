import { Schema, model, type Types } from "mongoose";
export interface AuditLogDocument { user?: Types.ObjectId; action: string; entityType: string; entityId?: string; oldValue?: unknown; newValue?: unknown; ipAddress?: string; userAgent?: string }
const schema = new Schema<AuditLogDocument>({
  user: { type: Schema.Types.ObjectId, ref: "User", index: true }, action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true }, entityId: { type: String, index: true },
  oldValue: Schema.Types.Mixed, newValue: Schema.Types.Mixed, ipAddress: String, userAgent: String
}, { timestamps: true, versionKey: false });
schema.index({ entityType: 1, entityId: 1, createdAt: -1 });
export const AuditLog = model<AuditLogDocument>("AuditLog", schema);
