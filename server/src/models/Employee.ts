import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";
export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "CONSULTANT"] as const;
export const EMPLOYEE_STATUSES = ["ACTIVE", "ONBOARDING", "ON_LEAVE", "INACTIVE"] as const;
export interface ExperienceItem { company: string; role: string; startDate: Date; endDate?: Date; summary?: string }
export interface EmployeeDocument {
  employeeId: string; user: Types.ObjectId; firstName: string; lastName: string; officialEmail: string; phone?: string;
  department: Types.ObjectId; team?: Types.ObjectId; designation: Types.ObjectId; reportingManager?: Types.ObjectId;
  dateOfJoining: Date; employmentType: typeof EMPLOYMENT_TYPES[number]; officeLocation?: string; status: typeof EMPLOYEE_STATUSES[number];
  profilePhotoKey?: string; personal?: { personalEmail?: string; dateOfBirth?: Date; address?: string; emergencyContact?: string };
  professionalSummary?: string; previousExperience: ExperienceItem[]; onboardingStep: number; profileCompletion: number; isActive: boolean; archivedAt?: Date;
}
const experienceSchema = new Schema<ExperienceItem>({ company: { type: String, required: true, maxlength: 120 }, role: { type: String, required: true, maxlength: 120 }, startDate: { type: Date, required: true }, endDate: Date, summary: { type: String, maxlength: 1000 } }, { _id: true });
const schema = new Schema<EmployeeDocument>({
  employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true }, user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  firstName: { type: String, required: true, trim: true, maxlength: 80 }, lastName: { type: String, required: true, trim: true, maxlength: 80 }, officialEmail: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }, phone: { type: String, trim: true, maxlength: 30 },
  department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true }, team: { type: Schema.Types.ObjectId, ref: "Team", index: true }, designation: { type: Schema.Types.ObjectId, ref: "Designation", required: true, index: true }, reportingManager: { type: Schema.Types.ObjectId, ref: "Employee", index: true },
  dateOfJoining: { type: Date, required: true, index: true }, employmentType: { type: String, enum: EMPLOYMENT_TYPES, required: true }, officeLocation: { type: String, trim: true, maxlength: 120 }, status: { type: String, enum: EMPLOYEE_STATUSES, default: "ONBOARDING", index: true },
  profilePhotoKey: String, personal: { personalEmail: String, dateOfBirth: Date, address: String, emergencyContact: String }, professionalSummary: { type: String, maxlength: 2000 }, previousExperience: { type: [experienceSchema], default: [] },
  onboardingStep: { type: Number, min: 1, max: 8, default: 1 }, profileCompletion: { type: Number, min: 0, max: 100, default: 20 }, isActive: { type: Boolean, default: true, index: true }, archivedAt: Date
}, { timestamps: true });
schema.index({ department: 1, team: 1, status: 1 }); schema.index({ firstName: "text", lastName: "text", employeeId: "text", officialEmail: "text" });
export const Employee = tenantModel<EmployeeDocument>("Employee", schema);
