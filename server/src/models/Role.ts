import { Schema, model } from "mongoose";
import { PERMISSIONS, ROLES, type PermissionName, type RoleName } from "@mobiusbloom/shared";

export interface RoleDocument { name: RoleName; description: string; permissions: PermissionName[]; isSystem: boolean }
const roleSchema = new Schema<RoleDocument>({
  name: { type: String, enum: ROLES, required: true, unique: true, index: true },
  description: { type: String, required: true, maxlength: 300 },
  permissions: [{ type: String, enum: PERMISSIONS, required: true }],
  isSystem: { type: Boolean, default: true }
}, { timestamps: true });
export const Role = model<RoleDocument>("Role", roleSchema);
