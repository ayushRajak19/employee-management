import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const GEO_NODE_TYPES = ["GLOBAL", "COUNTRY", "STATE", "DISTRICT", "CITY", "AREA", "PINCODE"] as const;
export type GeoNodeType = typeof GEO_NODE_TYPES[number];
export interface GeoNodeDocument { name: string; code: string; type: GeoNodeType; parent?: Types.ObjectId; ancestors: Types.ObjectId[]; depth: number; createdBy?: Types.ObjectId; location?: { type: "Point"; coordinates: [number, number] }; boundary?: { type: "Polygon" | "MultiPolygon"; coordinates: unknown[] }; isActive: boolean }
const schema = new Schema<GeoNodeDocument>({
  name: { type: String, required: true, trim: true, maxlength: 160 }, code: { type: String, required: true, uppercase: true, trim: true, maxlength: 40 }, type: { type: String, enum: GEO_NODE_TYPES, required: true, index: true },
  parent: { type: Schema.Types.ObjectId, ref: "GeoNode", index: true }, ancestors: [{ type: Schema.Types.ObjectId, ref: "GeoNode" }], depth: { type: Number, required: true, min: 0, max: 6 }, createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  location: { type: { type: String, enum: ["Point"] }, coordinates: [{ type: Number }] }, boundary: { type: { type: String, enum: ["Polygon", "MultiPolygon"] }, coordinates: [Schema.Types.Mixed] }, isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
schema.index({ code: 1 }, { unique: true }); schema.index({ parent: 1, isActive: 1 }); schema.index({ ancestors: 1, type: 1 }); schema.index({ location: "2dsphere" }, { sparse: true }); schema.index({ boundary: "2dsphere" }, { sparse: true });
export const GeoNode = tenantModel<GeoNodeDocument>("GeoNode", schema);
