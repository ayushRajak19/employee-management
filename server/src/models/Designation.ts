import { Schema, model, type Types } from "mongoose";
export interface RequiredSkill { skill: Types.ObjectId; minimumRating: number; isCritical: boolean }
export interface DesignationDocument { name: string; code: string; department?: Types.ObjectId; level?: string; description?: string; catalogRole?: string; requiredSkills: RequiredSkill[]; isActive: boolean; archivedAt?: Date }
const requiredSkillSchema = new Schema<RequiredSkill>({ skill: { type: Schema.Types.ObjectId, ref: "Skill", required: true }, minimumRating: { type: Number, required: true, min: 1, max: 10 }, isCritical: { type: Boolean, default: false } }, { _id: false });
const schema = new Schema<DesignationDocument>({
  name: { type: String, required: true, trim: true, maxlength: 120 }, code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20, index: true },
  department: { type: Schema.Types.ObjectId, ref: "Department", index: true }, level: { type: String, trim: true, maxlength: 50 }, description: { type: String, trim: true, maxlength: 500 }, catalogRole: { type: String, trim: true, maxlength: 120 },
  requiredSkills: { type: [requiredSkillSchema], default: [] }, isActive: { type: Boolean, default: true, index: true }, archivedAt: Date
}, { timestamps: true });
schema.index({ department: 1, name: 1 }); export const Designation = model<DesignationDocument>("Designation", schema);
