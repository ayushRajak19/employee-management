import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";
import { CAPABILITIES, type CapabilityName } from "@mobius-ems/shared";
export interface DepartmentDocument { name: string; code: string; description?: string; head?: Types.ObjectId; capabilities: CapabilityName[]; isActive: boolean; archivedAt?: Date }
const schema = new Schema<DepartmentDocument>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20, index: true },
  description: { type: String, trim: true, maxlength: 500 }, head: { type: Schema.Types.ObjectId, ref: "Employee", index: true }, capabilities: [{ type: String, enum: CAPABILITIES }],
  isActive: { type: Boolean, default: true, index: true }, archivedAt: Date
}, { timestamps: true });
schema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
export const Department = tenantModel<DepartmentDocument>("Department", schema);
