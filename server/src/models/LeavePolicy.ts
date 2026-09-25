import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface LeavePolicyDocument {
  _id: Types.ObjectId;
  name: string;
  code: string;
  quotaDays: number;
  isPaid: boolean;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<LeavePolicyDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 100 },
    quotaDays: { type: Number, required: true, min: 0, max: 999 },
    isPaid: { type: Boolean, default: true },
    description: { type: String, trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false }
  },
  { timestamps: true }
);

schema.index({ code: 1, isActive: 1 });

export const LeavePolicy = tenantModel<LeavePolicyDocument>("LeavePolicy", schema);
