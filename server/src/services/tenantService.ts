import bcrypt from "bcrypt";
import { Tenant, type TenantStatus } from "../models/Tenant.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { runWithTenant } from "../tenancy/tenantContext.js";
import { seedTenantOrganizationPresets, seedTenantRoles } from "../jobs/seedSuperAdmin.js";

interface CreateTenantInput {
  name: string;
  slug: string;
  plan: "STANDARD" | "ENTERPRISE";
  adminName: string;
  adminEmail: string;
  temporaryPassword: string;
}

const publicFields = "name slug status plan activatedAt createdAt updatedAt";
export const listTenants = () => Tenant.find().select(publicFields).sort({ createdAt: -1 }).lean();

export const createTenant = async (input: CreateTenantInput, actorId: string) => {
  let tenant = await Tenant.findOne({ slug: input.slug });
  if (tenant && tenant.status !== "PROVISIONING") throw new AppError("That organization ID is already in use", 409, "TENANT_EXISTS");
  if (!tenant) tenant = await Tenant.create({ name: input.name, slug: input.slug, plan: input.plan, status: "PROVISIONING", createdBy: actorId });

  await runWithTenant(tenant._id, async () => {
    await seedTenantRoles();
    await seedTenantOrganizationPresets();
    const role = await Role.findOne({ name: "SUPER_ADMIN" }).orFail();
    const existingAdmin = await User.findOne({ email: input.adminEmail }).select("+passwordHash");
    if (existingAdmin) {
      existingAdmin.name = input.adminName;
      existingAdmin.passwordHash = await bcrypt.hash(input.temporaryPassword, 12);
      existingAdmin.role = role._id;
      existingAdmin.isActive = true;
      existingAdmin.forcePasswordChange = true;
      existingAdmin.onboardingComplete = true;
      await existingAdmin.save();
    } else {
      await User.create({
        name: input.adminName,
        email: input.adminEmail,
        passwordHash: await bcrypt.hash(input.temporaryPassword, 12),
        role: role._id,
        isActive: true,
        forcePasswordChange: true,
        onboardingComplete: true,
      });
    }
  });

  tenant.name = input.name;
  tenant.plan = input.plan;
  tenant.status = "ACTIVE";
  tenant.activatedAt ??= new Date();
  await tenant.save();
  return Tenant.findById(tenant._id).select(publicFields).lean();
};

export const updateTenantStatus = async (id: string, status: Exclude<TenantStatus, "PROVISIONING">, actorTenantId: string) => {
  if (id === actorTenantId && status === "SUSPENDED") throw new AppError("You cannot suspend the organization used by your current session", 409, "CURRENT_TENANT");
  const tenant = await Tenant.findByIdAndUpdate(id, { $set: { status, ...(status === "ACTIVE" ? { activatedAt: new Date() } : {}) } }, { new: true, runValidators: true }).select(publicFields).lean();
  if (!tenant) throw new AppError("Organization not found", 404);
  return tenant;
};
