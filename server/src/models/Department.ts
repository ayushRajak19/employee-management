import { Schema, model, type Types } from "mongoose";
export interface DepartmentDocument { name: string; code: string; description?: string; head?: Types.ObjectId; isActive: boolean; archivedAt?: Date }
const schema = new Schema<DepartmentDocument>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20, index: true },
  description: { type: String, trim: true, maxlength: 500 }, head: { type: Schema.Types.ObjectId, ref: "Employee", index: true },
  isActive: { type: Boolean, default: true, index: true }, archivedAt: Date
}, { timestamps: true });
schema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
export const Department = model<DepartmentDocument>("Department", schema);
