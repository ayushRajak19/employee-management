import { Schema, model, type Types } from "mongoose";
export interface JobDescriptionRecord { title: string; description: string; createdBy: Types.ObjectId; updatedBy: Types.ObjectId; isActive: boolean }
const schema = new Schema<JobDescriptionRecord>({ title: { type: String, required: true, trim: true, maxlength: 160 }, description: { type: String, required: true, trim: true, minlength: 100, maxlength: 30_000 }, createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, isActive: { type: Boolean, default: true, index: true } }, { timestamps: true });
schema.index({ title: 1 }, { unique: true, partialFilterExpression: { isActive: true }, collation: { locale: "en", strength: 2 } });
export const JobDescription = model<JobDescriptionRecord>("JobDescription", schema);
