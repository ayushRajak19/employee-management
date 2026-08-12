import { Schema, model, type Types } from "mongoose";
export interface TeamDocument { name: string; code: string; department: Types.ObjectId; lead?: Types.ObjectId; description?: string; isActive: boolean; archivedAt?: Date }
const schema = new Schema<TeamDocument>({
  name: { type: String, required: true, trim: true, maxlength: 120 }, code: { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
  department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true }, lead: { type: Schema.Types.ObjectId, ref: "Employee", index: true },
  description: { type: String, trim: true, maxlength: 500 }, isActive: { type: Boolean, default: true, index: true }, archivedAt: Date
}, { timestamps: true });
schema.index({ department: 1, name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } }); schema.index({ department: 1, code: 1 }, { unique: true });
export const Team = model<TeamDocument>("Team", schema);
