import { Schema, model } from "mongoose";

export interface AiContentCacheDocument { key: string; content: string; provider: string; model: string; expiresAt: Date }
const schema = new Schema<AiContentCacheDocument>({
  key: { type: String, required: true, unique: true, index: true },
  content: { type: String, required: true, maxlength: 10_000 },
  provider: { type: String, required: true }, model: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true, versionKey: false });
export const AiContentCache = model<AiContentCacheDocument>("AiContentCache", schema);
