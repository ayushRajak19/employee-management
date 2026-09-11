import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface UserDocument {
  name: string; email: string; passwordHash: string; role: Types.ObjectId; employee?: Types.ObjectId;
  isActive: boolean; forcePasswordChange: boolean; onboardingComplete: boolean; passwordChangedAt?: Date; lastLoginAt?: Date; passwordResetTokenHash?: string; passwordResetTokenExpiresAt?: Date;
}
const userSchema = new Schema<UserDocument>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: Schema.Types.ObjectId, ref: "Role", required: true, index: true },
  employee: { type: Schema.Types.ObjectId, ref: "Employee", index: true },
  isActive: { type: Boolean, default: true, index: true },
  forcePasswordChange: { type: Boolean, default: true },
  onboardingComplete: { type: Boolean, default: false },
  passwordChangedAt: Date, lastLoginAt: Date, passwordResetTokenHash: { type: String, select: false, index: true }, passwordResetTokenExpiresAt: Date
}, { timestamps: true });
userSchema.index({ isActive: 1, role: 1 });
export const User = tenantModel<UserDocument>("User", userSchema);
