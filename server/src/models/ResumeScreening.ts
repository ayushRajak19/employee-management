import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export type FitClassification = "STRONG_FIT" | "POTENTIAL_FIT" | "NOT_FIT";
export interface ScreeningResultRecord { applicant: Types.ObjectId; candidateName: string; score: number; classification: FitClassification; summary: string; writtenReason: string; matchedRequirements: string[]; missingRequirements: string[]; evidence: string[] }
export interface ResumeScreeningRecord { jobTitle: string; jobDescription: string; status: "COMPLETED"; results: ScreeningResultRecord[]; provider: string; model: string; createdBy: Types.ObjectId }

const resultSchema = new Schema<ScreeningResultRecord>({
  applicant: { type: Schema.Types.ObjectId, ref: "Applicant", required: true }, candidateName: { type: String, required: true, trim: true, maxlength: 120 }, score: { type: Number, required: true, min: 0, max: 100 }, classification: { type: String, enum: ["STRONG_FIT", "POTENTIAL_FIT", "NOT_FIT"], required: true }, summary: { type: String, required: true, maxlength: 1200 }, writtenReason: { type: String, required: true, maxlength: 2400 }, matchedRequirements: [{ type: String, maxlength: 300 }], missingRequirements: [{ type: String, maxlength: 300 }], evidence: [{ type: String, maxlength: 400 }]
}, { _id: false });
const resumeScreeningSchema = new Schema<ResumeScreeningRecord>({
  jobTitle: { type: String, required: true, trim: true, maxlength: 160 }, jobDescription: { type: String, required: true, maxlength: 30_000 }, status: { type: String, enum: ["COMPLETED"], default: "COMPLETED" }, results: { type: [resultSchema], required: true }, provider: { type: String, required: true, maxlength: 40 }, model: { type: String, required: true, maxlength: 120 }, createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
resumeScreeningSchema.index({ createdAt: -1 });
export const ResumeScreening = tenantModel<ResumeScreeningRecord>("ResumeScreening", resumeScreeningSchema);
