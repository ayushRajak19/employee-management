import { Schema, model, type Types } from "mongoose";
export interface AiEmployeeSummaryDocument { employee: Types.ObjectId; kind: "CONTRIBUTION" | "PERFORMANCE"; summary: string; provider: string; model: string; generatedBy: Types.ObjectId; generatedAt: Date }
const schema = new Schema<AiEmployeeSummaryDocument>({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  kind: { type: String, enum: ["CONTRIBUTION", "PERFORMANCE"], required: true },
  summary: { type: String, required: true, maxlength: 20_000 }, provider: { type: String, required: true }, model: { type: String, required: true },
  generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, generatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
schema.index({ employee: 1, kind: 1 }, { unique: true });
export const AiEmployeeSummary = model<AiEmployeeSummaryDocument>("AiEmployeeSummary", schema);
