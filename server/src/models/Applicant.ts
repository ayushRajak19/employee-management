import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface ApplicantRecord {
  name: string;
  designation: string;
  jobCategory?: string;
  city?: string;
  state?: string;
  matchScore?: number;
  originalName: string;
  storageProvider: "CLOUDINARY" | "MONGODB";
  storageKey: string;
  format?: string;
  mimeType: string;
  size: number;
  uploadedBy: Types.ObjectId;
  isActive: boolean;
}

const applicantSchema = new Schema<ApplicantRecord>({
  name: { type: String, required: true, trim: true, maxlength: 120, index: true },
  designation: { type: String, required: true, trim: true, maxlength: 120, index: true },
  jobCategory: { type: String, trim: true, maxlength: 160, index: true },
  city: { type: String, trim: true, maxlength: 120, index: true },
  state: { type: String, trim: true, maxlength: 120, index: true },
  matchScore: { type: Number, min: 0, max: 100 },
  originalName: { type: String, required: true, maxlength: 255 },
  storageProvider: { type: String, enum: ["CLOUDINARY", "MONGODB"], required: true },
  storageKey: { type: String, required: true, unique: true },
  format: String,
  mimeType: { type: String, required: true, maxlength: 120 },
  size: { type: Number, required: true, min: 1 },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

applicantSchema.index({ createdAt: -1, jobCategory: 1 });
export const Applicant = tenantModel<ApplicantRecord>("Applicant", applicantSchema);
