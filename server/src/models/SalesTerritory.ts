import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const TERRITORY_STATUSES = ["PLANNED", "ACTIVE", "INACTIVE"] as const;
export interface TerritoryCoverageRules { geoNodeIds: Types.ObjectId[]; pincodes: string[]; productIds: string[]; channels: string[]; industries: string[]; customerTypes: string[]; namedAccountIds: Types.ObjectId[] }
export interface SalesTerritoryDocument { name: string; code: string; parentTerritory?: Types.ObjectId; ancestors: Types.ObjectId[]; status: typeof TERRITORY_STATUSES[number]; ownerEmployee?: Types.ObjectId; effectiveFrom: Date; effectiveTo?: Date; coverageRules: TerritoryCoverageRules }
const schema = new Schema<SalesTerritoryDocument>({
  name: { type: String, required: true, trim: true, maxlength: 160 }, code: { type: String, required: true, uppercase: true, trim: true, maxlength: 40 }, parentTerritory: { type: Schema.Types.ObjectId, ref: "SalesTerritory", index: true }, ancestors: [{ type: Schema.Types.ObjectId, ref: "SalesTerritory" }], status: { type: String, enum: TERRITORY_STATUSES, default: "ACTIVE", index: true }, ownerEmployee: { type: Schema.Types.ObjectId, ref: "Employee", index: true }, effectiveFrom: { type: Date, required: true }, effectiveTo: Date,
  coverageRules: { geoNodeIds: [{ type: Schema.Types.ObjectId, ref: "GeoNode" }], pincodes: [{ type: String, trim: true }], productIds: [{ type: String, trim: true }], channels: [{ type: String, trim: true }], industries: [{ type: String, trim: true }], customerTypes: [{ type: String, trim: true }], namedAccountIds: [{ type: Schema.Types.ObjectId, ref: "SalesCustomer" }] },
}, { timestamps: true });
schema.pre("validate", function () { if (this.effectiveTo && this.effectiveTo < this.effectiveFrom) this.invalidate("effectiveTo", "Effective end must be after start"); });
schema.index({ code: 1 }, { unique: true }); schema.index({ parentTerritory: 1, status: 1 }); schema.index({ ancestors: 1, status: 1 }); schema.index({ "coverageRules.geoNodeIds": 1, status: 1 });
export const SalesTerritory = tenantModel<SalesTerritoryDocument>("SalesTerritory", schema);
