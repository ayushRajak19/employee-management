import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";
export interface RequiredSkill { skill: Types.ObjectId; minimumRating: number; isCritical: boolean }
export interface DesignationSkillItem {
  id: string;
  name: string;
  category: string;
  level: "Basic" | "Intermediate" | "Advanced";
  tools?: string;
  description: string;
  assessmentQuestion?: string;
}
export interface DesignationDocument {
  name: string;
  code: string;
  department?: Types.ObjectId;
  level?: string;
  description?: string;
  catalogRole?: string;
  requiredSkills: RequiredSkill[];
  customSkills: DesignationSkillItem[];
  isActive: boolean;
  archivedAt?: Date;
}
const requiredSkillSchema = new Schema<RequiredSkill>({ skill: { type: Schema.Types.ObjectId, ref: "Skill", required: true }, minimumRating: { type: Number, required: true, min: 1, max: 10 }, isCritical: { type: Boolean, default: false } }, { _id: false });
const customSkillSchema = new Schema<DesignationSkillItem>({
  id: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  level: { type: String, enum: ["Basic", "Intermediate", "Advanced"], default: "Basic" },
  tools: { type: String, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  assessmentQuestion: { type: String, trim: true, maxlength: 1000 },
}, { _id: false });
const schema = new Schema<DesignationDocument>({
  name: { type: String, required: true, trim: true, maxlength: 120 }, code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20, index: true },
  department: { type: Schema.Types.ObjectId, ref: "Department", index: true }, level: { type: String, trim: true, maxlength: 50 }, description: { type: String, trim: true, maxlength: 500 }, catalogRole: { type: String, trim: true, maxlength: 120 },
  requiredSkills: { type: [requiredSkillSchema], default: [] },
  customSkills: { type: [customSkillSchema], default: [] },
  isActive: { type: Boolean, default: true, index: true }, archivedAt: Date
}, { timestamps: true });
schema.index({ department: 1, name: 1 }); export const Designation = tenantModel<DesignationDocument>("Designation", schema);
