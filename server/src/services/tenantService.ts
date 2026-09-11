import bcrypt from "bcrypt";
import { Tenant, type TenantStatus } from "../models/Tenant.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { runWithTenant } from "../tenancy/tenantContext.js";
import { seedTenantRoles } from "../jobs/seedSuperAdmin.js";

interface CreateTenantInput {
  name: string;
  slug?: string;
  industry?: string;
  companySize?: string;
  country?: string;
  website?: string;
  referralSource?: string;
  primaryUseCase?: string;
  plan: "STANDARD" | "ENTERPRISE";
  adminName: string;
  adminEmail: string;
  temporaryPassword: string;
}

const publicFields = "name slug industry companySize country website referralSource primaryUseCase status plan activatedAt createdAt updatedAt";
export const listTenants = () => Tenant.find().select(publicFields).sort({ createdAt: -1 }).lean();

export const generateTenantSlug = async (name: string): Promise<string> => {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "organization";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 8);
    const candidate = `${base}-${suffix}`;
    if (!await Tenant.exists({ slug: candidate })) return candidate;
  }
  throw new AppError("Could not generate an organization ID. Please try again", 503, "TENANT_ID_GENERATION_FAILED");
};

export const createTenant = async (input: CreateTenantInput, actorId?: string) => {
  const slug = input.slug ?? await generateTenantSlug(input.name);
  let tenant = await Tenant.findOne({ slug });
  if (tenant && (!actorId || tenant.status !== "PROVISIONING")) throw new AppError("That organization ID is already in use", 409, "TENANT_EXISTS");
  if (!tenant) tenant = await Tenant.create({ ...input, slug, status: "PROVISIONING", createdBy: actorId });

  await runWithTenant(tenant._id, async () => {
    await seedTenantRoles();
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
        forcePasswordChange: Boolean(actorId),
        onboardingComplete: true,
      });
    }
  });

  tenant.name = input.name;
  tenant.plan = input.plan;
  tenant.set({ industry: input.industry, companySize: input.companySize, country: input.country, website: input.website, referralSource: input.referralSource, primaryUseCase: input.primaryUseCase });
  tenant.status = "ACTIVE";
  tenant.activatedAt ??= new Date();
  await tenant.save();
  return Tenant.findById(tenant._id).select(publicFields).lean();
};

export const platformAnalytics = async () => {
  const [tenants, usersByTenant, employeesByTenant, adminsByTenant, monthlyOrganizations, monthlyUsers] = await Promise.all([
    Tenant.find().select(publicFields).sort({ createdAt: -1 }).lean(),
    User.collection.aggregate<{ _id: unknown; count: number }>([{ $match: { isActive: true } }, { $group: { _id: "$tenantId", count: { $sum: 1 } } }]).toArray(),
    User.collection.aggregate<{ _id: unknown; count: number }>([{ $match: { isActive: true, employee: { $exists: true } } }, { $group: { _id: "$tenantId", count: { $sum: 1 } } }]).toArray(),
    User.collection.aggregate<{ _id: unknown; admins: { name: string; email: string }[] }>([{ $match: { isActive: true } }, { $lookup: { from: "roles", localField: "role", foreignField: "_id", as: "role" } }, { $unwind: "$role" }, { $match: { "role.name": "SUPER_ADMIN" } }, { $group: { _id: "$tenantId", admins: { $push: { name: "$name", email: "$email" } } } }]).toArray(),
    Tenant.aggregate<{ _id: string; count: number }>([{ $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    User.collection.aggregate<{ _id: string; count: number }>([{ $match: { isActive: true } }, { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray(),
  ]);
  const counts = new Map(usersByTenant.map((item) => [String(item._id), item.count]));
  const employeeCounts = new Map(employeesByTenant.map((item) => [String(item._id), item.count]));
  const admins = new Map(adminsByTenant.map((item) => [String(item._id), item.admins.slice(0, 10)]));
  const items = tenants.map((tenant) => ({ ...tenant, userCount: counts.get(String(tenant._id)) ?? 0, employeeCount: employeeCounts.get(String(tenant._id)) ?? 0, adminUsers: admins.get(String(tenant._id)) ?? [] }));
  return {
    summary: { organizations: items.length, activeOrganizations: items.filter((item) => item.status === "ACTIVE").length, suspendedOrganizations: items.filter((item) => item.status === "SUSPENDED").length, users: items.reduce((sum, item) => sum + item.userCount, 0) },
    growth: [...new Set([...monthlyOrganizations.map((item) => item._id), ...monthlyUsers.map((item) => item._id)])].sort().map((month) => ({ month, organizations: monthlyOrganizations.find((item) => item._id === month)?.count ?? 0, users: monthlyUsers.find((item) => item._id === month)?.count ?? 0 })),
    items,
  };
};

export const updateTenantStatus = async (id: string, status: Exclude<TenantStatus, "PROVISIONING">, actorTenantId: string) => {
  if (id === actorTenantId && status === "SUSPENDED") throw new AppError("You cannot suspend the organization used by your current session", 409, "CURRENT_TENANT");
  const tenant = await Tenant.findByIdAndUpdate(id, { $set: { status, ...(status === "ACTIVE" ? { activatedAt: new Date() } : {}) } }, { new: true, runValidators: true }).select(publicFields).lean();
  if (!tenant) throw new AppError("Organization not found", 404);
  return tenant;
};
