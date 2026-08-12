import { Schema, model, type Types } from "mongoose";
import { CONTRIBUTION_AREAS, type ContributionArea } from "./ContributionReview.js";

export interface ContributionSnapshotDocument {
  employee: Types.ObjectId;
  period: string;
  role: string;
  totalScore: number;
  classification: string;
  evidenceCoverage: number;
  components: { key: ContributionArea; label: string; score: number; configuredWeight: number; effectiveWeight: number; contribution: number; available: boolean; explanation: string }[];
  alerts: { type: string; severity: "INFO" | "ATTENTION" | "HIGH"; title: string; detail: string; private: boolean }[];
  calculatedBy: Types.ObjectId;
  calculatedAt: Date;
}

const componentSchema = new Schema({
  key: { type: String, enum: CONTRIBUTION_AREAS, required: true }, label: String, score: Number,
  configuredWeight: Number, effectiveWeight: Number, contribution: Number, available: Boolean, explanation: String
}, { _id: false });
const alertSchema = new Schema({ type: String, severity: { type: String, enum: ["INFO", "ATTENTION", "HIGH"] }, title: String, detail: String, private: { type: Boolean, default: true } }, { _id: false });

const schema = new Schema<ContributionSnapshotDocument>({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  period: { type: String, required: true, index: true }, role: { type: String, required: true },
  totalScore: { type: Number, required: true, min: 0, max: 100 }, classification: { type: String, required: true },
  evidenceCoverage: { type: Number, required: true, min: 0, max: 100 }, components: { type: [componentSchema], required: true },
  alerts: { type: [alertSchema], default: [] }, calculatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
schema.index({ employee: 1, period: 1 }, { unique: true });
export const ContributionSnapshot = model<ContributionSnapshotDocument>("ContributionSnapshot", schema);
