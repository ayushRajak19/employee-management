import { Schema, model, type Types } from "mongoose";

export interface ApplicantRecord {
  name: string;
  designation: string;
  originalName: string;
  storageProvider: "CLOUDINARY";
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
  originalName: { type: String, required: true, maxlength: 255 },
  storageProvider: { type: String, enum: ["CLOUDINARY"], required: true },
  storageKey: { type: String, required: true, unique: true },
  format: String,
  mimeType: { type: String, required: true, maxlength: 120 },
  size: { type: Number, required: true, min: 1 },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

applicantSchema.index({ createdAt: -1, designation: 1 });
export const Applicant = model<ApplicantRecord>("Applicant", applicantSchema);
