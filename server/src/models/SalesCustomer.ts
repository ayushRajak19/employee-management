import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface SalesCustomerDocument {
  name: string;
  primaryContactName?: string;
  email?: string;
  phone?: string;
  sourceLead?: Types.ObjectId;
  ownerEmployee: Types.ObjectId;
  territory: Types.ObjectId;
  geoNode?: Types.ObjectId;
  coordinates?: { type: "Point"; coordinates: [number, number] };
  status: "ACTIVE" | "INACTIVE";
  customerType?: string;
  lifetimeRevenue: number;
  currency: string;
  lastOrderDate?: Date;
}

const schema = new Schema<SalesCustomerDocument>({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  primaryContactName: { type: String, trim: true, maxlength: 160 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 40 },
  sourceLead: { type: Schema.Types.ObjectId, ref: "SalesLead" },
  ownerEmployee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  territory: { type: Schema.Types.ObjectId, ref: "SalesTerritory", required: true, index: true },
  geoNode: { type: Schema.Types.ObjectId, ref: "GeoNode", index: true },
  coordinates: { type: { type: String, enum: ["Point"] }, coordinates: [{ type: Number }] },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
  customerType: { type: String, trim: true, maxlength: 80 },
  lifetimeRevenue: { type: Number, min: 0, default: 0 },
  currency: { type: String, uppercase: true, trim: true, maxlength: 3, default: "INR" },
  lastOrderDate: Date,
}, { timestamps: true });

schema.index({ ownerEmployee: 1, status: 1 });
schema.index({ territory: 1, status: 1 });
schema.index({ geoNode: 1, status: 1 });
schema.index({ coordinates: "2dsphere" }, { sparse: true });
schema.index({ sourceLead: 1 }, { unique: true, sparse: true });

export const SalesCustomer = tenantModel<SalesCustomerDocument>("SalesCustomer", schema);
