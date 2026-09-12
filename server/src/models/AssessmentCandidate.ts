import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface AssessmentCandidateDocument {
  name: string;
  email: string;
  position?: string;
  user: Types.ObjectId;
  createdBy: Types.ObjectId;
  isActive: boolean;
}
const schema = new Schema<AssessmentCandidateDocument>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  position: { type: String, trim: true, maxlength: 160 },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
schema.index({ email: 1 }, { unique: true });
export const AssessmentCandidate = tenantModel<AssessmentCandidateDocument>("AssessmentCandidate", schema);
