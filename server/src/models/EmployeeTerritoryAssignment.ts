import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";
export const ASSIGNMENT_ROLES = ["OWNER", "MANAGER", "MEMBER", "OVERLAY"] as const;
export interface EmployeeTerritoryAssignmentDocument { employee: Types.ObjectId; territory: Types.ObjectId; assignmentRole: typeof ASSIGNMENT_ROLES[number]; primary: boolean; effectiveFrom: Date; effectiveTo?: Date; leadCapacityPerMonth?: number; isActive: boolean }
const schema = new Schema<EmployeeTerritoryAssignmentDocument>({ employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true }, territory: { type: Schema.Types.ObjectId, ref: "SalesTerritory", required: true, index: true }, assignmentRole: { type: String, enum: ASSIGNMENT_ROLES, required: true }, primary: { type: Boolean, default: false }, effectiveFrom: { type: Date, required: true }, effectiveTo: Date, leadCapacityPerMonth: { type: Number, min: 1 }, isActive: { type: Boolean, default: true, index: true } }, { timestamps: true });
schema.pre("validate", function () { if (this.effectiveTo && this.effectiveTo < this.effectiveFrom) this.invalidate("effectiveTo", "Effective end must be after start"); });
schema.index({ employee: 1, territory: 1, effectiveFrom: 1 }); schema.index({ territory: 1, effectiveFrom: 1, effectiveTo: 1 });
export const EmployeeTerritoryAssignment = tenantModel<EmployeeTerritoryAssignmentDocument>("EmployeeTerritoryAssignment", schema);
