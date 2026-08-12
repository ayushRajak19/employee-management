import { Schema, model } from "mongoose";
export interface SkillDocument { name: string; normalizedName: string; category: string; description?: string; isActive: boolean; archivedAt?: Date }
const schema = new Schema<SkillDocument>({ name: { type: String, required: true, trim: true, maxlength: 120 }, normalizedName: { type: String, required: true, unique: true, index: true }, category: { type: String, required: true, trim: true, maxlength: 80, index: true }, description: { type: String, maxlength: 500 }, isActive: { type: Boolean, default: true, index: true }, archivedAt: Date }, { timestamps: true });
schema.pre("validate", function () { this.normalizedName = this.name.trim().toLowerCase(); }); export const Skill = model<SkillDocument>("Skill", schema);
