import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface RoleSkillScore {
  skillId: string;
  level: string;
  category: string;
  name: string;
  tools?: string;
  description: string;
  assessmentQuestion?: string;
  rating: number;
  implementationNote?: string;
  demonstratedRating?: number;
  velocityRatio?: number;
  credibilityStatus?: "EXCEEDED" | "JUSTIFIED" | "GAP_DETECTED" | "UNTESTED";
  tasksEvaluatedCount?: number;
}

export interface RoleSkillAssessmentDocument {
  employee: Types.ObjectId;
  role: string;
  designation?: string;
  scores: RoleSkillScore[];
  averageRating: number;
  demonstratedAverage?: number;
  overallCredibilityScore?: number;
  departmentRank?: number;
  companyRank?: number;
  submittedAt: Date;
}

const scoreSchema = new Schema<RoleSkillScore>({
  skillId: { type: String, required: true, trim: true },
  level: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  tools: { type: String, trim: true, default: "" },
  description: { type: String, required: true, trim: true },
  assessmentQuestion: { type: String, trim: true, maxlength: 1000 },
  rating: { type: Number, required: true, min: 1, max: 10 },
  implementationNote: { type: String, trim: true, maxlength: 1000 },
  demonstratedRating: { type: Number, min: 1, max: 10 },
  velocityRatio: { type: Number, min: 0 },
  credibilityStatus: { type: String, enum: ["EXCEEDED", "JUSTIFIED", "GAP_DETECTED", "UNTESTED"], default: "UNTESTED" },
  tasksEvaluatedCount: { type: Number, default: 0 }
}, { _id: false });

const schema = new Schema<RoleSkillAssessmentDocument>({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, unique: true, index: true },
  role: { type: String, required: true, trim: true, index: true },
  designation: { type: String, trim: true, maxlength: 120 },
  scores: { type: [scoreSchema], required: true },
  averageRating: { type: Number, required: true, min: 1, max: 10 },
  demonstratedAverage: { type: Number, min: 1, max: 10 },
  overallCredibilityScore: { type: Number, min: 0, max: 200 },
  departmentRank: { type: Number, min: 1 },
  companyRank: { type: Number, min: 1 },
  submittedAt: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

export const RoleSkillAssessment = tenantModel<RoleSkillAssessmentDocument>("RoleSkillAssessment", schema);

