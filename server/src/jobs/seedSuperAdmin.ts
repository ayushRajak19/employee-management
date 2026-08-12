import bcrypt from "bcrypt";
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from "@mobiusbloom/shared";
import { env } from "../config/env.js";
import { Permission } from "../models/Permission.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { Department } from "../models/Department.js";
import { Team } from "../models/Team.js";
import { Designation } from "../models/Designation.js";

export const seedOrganization = async (): Promise<void> => {
  if (!env.SUPER_ADMIN_NAME || !env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) {
    throw new Error("SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required for seeding");
  }
  await Permission.bulkWrite(PERMISSIONS.map((key) => ({ updateOne: { filter: { key }, update: { $set: { description: key.replace(".", " ") } }, upsert: true } })));
  await Role.bulkWrite(ROLES.map((name) => ({ updateOne: { filter: { name }, update: { $set: { description: name.replaceAll("_", " "), permissions: [...ROLE_PERMISSIONS[name]], isSystem: true } }, upsert: true } })));
  const departmentPresets = [
    { name: "IT", code: "IT" },
    { name: "Sales", code: "SALE" },
    { name: "Marketing", code: "MARK" },
    { name: "HR", code: "HR" },
    { name: "Operations", code: "OPER" },
  ];
  const departments = new Map<string, InstanceType<typeof Department>>();
  for (const preset of departmentPresets) {
    const department = await Department.findOneAndUpdate(
      { code: preset.code },
      { $set: { ...preset, description: `${preset.name} department`, isActive: true } },
      { upsert: true, new: true, runValidators: true },
    );
    departments.set(preset.name, department);
  }
  await Team.findOneAndUpdate(
    { department: departments.get("IT")!._id, code: "DEV" },
    { $set: { name: "Development", description: "Software development team", isActive: true } },
    { upsert: true, new: true, runValidators: true },
  );
  const designationPresets = [
    { name: "Software Engineer", code: "SWE", department: "IT" },
    { name: "Senior Engineer", code: "SSE", department: "IT" },
    { name: "Sales Executive", code: "SALES", department: "Sales" },
    { name: "Marketing Specialist", code: "MKT", department: "Marketing" },
    { name: "HR Executive", code: "HRE", department: "HR" },
    { name: "Operations Analyst", code: "OPS", department: "Operations" },
  ];
  for (const preset of designationPresets) {
    await Designation.findOneAndUpdate(
      { code: preset.code },
      { $set: { name: preset.name, department: departments.get(preset.department)!._id, isActive: true } },
      { upsert: true, new: true, runValidators: true },
    );
  }
  const role = await Role.findOne({ name: "SUPER_ADMIN" }).orFail();
  const existing = await User.findOne({ email: env.SUPER_ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    existing.name = env.SUPER_ADMIN_NAME;
    existing.role = role._id;
    existing.isActive = true;
    existing.onboardingComplete = true;
    existing.forcePasswordChange = false;
    existing.passwordHash = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 12);
    await existing.save();
    console.log("Super Admin credentials synchronized");
  }
  else { await User.create({ name: env.SUPER_ADMIN_NAME, email: env.SUPER_ADMIN_EMAIL, passwordHash: await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 12), role: role._id, isActive: true, forcePasswordChange: false, onboardingComplete: true }); console.log("Super Admin created"); }
  console.log("Organization presets seeded");
};
