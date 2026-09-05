import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const CONTRIBUTION_AREAS = ["delivery", "quality", "reliability", "impact", "collaboration", "growth"] as const;
export type ContributionArea = typeof CONTRIBUTION_AREAS[number];

export interface ContributionReviewDocument {
  employee: Types.ObjectId;
  period: string;
  selfReview?: {
    accomplishments: string;
    impact: string;
    collaboration: string;
    growth: string;
    challenges?: string;
    evidenceLinks: string[];
    submittedAt: Date;
  };
  managerReview?: {
    ratings: Record<ContributionArea, number>;
    comment: string;
    reviewedBy: Types.ObjectId;
    reviewedAt: Date;
  };
  employeeResponse?: string;
  acknowledgedAt?: Date;
  status: "DRAFT" | "SELF_SUBMITTED" | "MANAGER_REVIEWED" | "ACKNOWLEDGED";
}

const ratingsSchema = new Schema({
  delivery: { type: Number, required: true, min: 1, max: 5 },
  quality: { type: Number, required: true, min: 1, max: 5 },
  reliability: { type: Number, required: true, min: 1, max: 5 },
  impact: { type: Number, required: true, min: 1, max: 5 },
  collaboration: { type: Number, required: true, min: 1, max: 5 },
  growth: { type: Number, required: true, min: 1, max: 5 }
}, { _id: false });

const schema = new Schema<ContributionReviewDocument>({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  period: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/, index: true },
  selfReview: {
    accomplishments: { type: String, maxlength: 5000 }, impact: { type: String, maxlength: 5000 },
    collaboration: { type: String, maxlength: 5000 }, growth: { type: String, maxlength: 5000 },
    challenges: { type: String, maxlength: 3000 }, evidenceLinks: { type: [String], default: [] }, submittedAt: Date
  },
  managerReview: { ratings: ratingsSchema, comment: { type: String, maxlength: 5000 }, reviewedBy: { type: Schema.Types.ObjectId, ref: "User" }, reviewedAt: Date },
  employeeResponse: { type: String, maxlength: 3000 },
  acknowledgedAt: Date,
  status: { type: String, enum: ["DRAFT", "SELF_SUBMITTED", "MANAGER_REVIEWED", "ACKNOWLEDGED"], default: "DRAFT", index: true }
}, { timestamps: true });

schema.index({ employee: 1, period: 1 }, { unique: true });
export const ContributionReview = tenantModel<ContributionReviewDocument>("ContributionReview", schema);
