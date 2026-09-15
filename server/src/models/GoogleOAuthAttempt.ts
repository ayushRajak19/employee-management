import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

interface Attempt { stateHash: string; actor: Types.ObjectId; verifierEncrypted: string; expiresAt: Date }
const schema = new Schema<Attempt>({
  stateHash: { type: String, required: true, unique: true },
  actor: { type: Schema.Types.ObjectId, required: true },
  verifierEncrypted: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true, expires: 0 },
});
export const GoogleOAuthAttempt = tenantModel<Attempt>("GoogleOAuthAttempt", schema);
