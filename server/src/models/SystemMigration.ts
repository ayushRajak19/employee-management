import { Schema, model } from "mongoose";

export interface SystemMigrationDocument { key: string; appliedAt: Date; details?: Record<string, unknown> }
const schema = new Schema<SystemMigrationDocument>({
  key: { type: String, required: true, unique: true },
  appliedAt: { type: Date, required: true, default: Date.now },
  details: Schema.Types.Mixed,
}, { timestamps: true });
export const SystemMigration = model<SystemMigrationDocument>("SystemMigration", schema);

