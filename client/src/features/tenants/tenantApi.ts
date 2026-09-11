import { api } from "@/api/client";

export interface TenantItem {
  _id: string;
  name: string;
  slug: string;
  status: "PROVISIONING" | "ACTIVE" | "SUSPENDED";
  plan: "STANDARD" | "ENTERPRISE";
  activatedAt?: string;
  createdAt: string;
  industry?: string;
  companySize?: string;
  country?: string;
  referralSource?: string;
  primaryUseCase?: string;
  userCount?: number;
}

export interface CreateTenantInput {
  name: string;
  slug?: string;
  plan: "STANDARD" | "ENTERPRISE";
  adminName: string;
  adminEmail: string;
  temporaryPassword: string;
}

export const tenantApi = {
  list: () => api.get<{ items: TenantItem[] }>("/api/v1/platform/tenants"),
  create: (body: CreateTenantInput) => api.post<{ item: TenantItem }>("/api/v1/platform/tenants", body),
  updateStatus: (id: string, status: "ACTIVE" | "SUSPENDED") => api.patch<{ item: TenantItem }>(`/api/v1/platform/tenants/${id}/status`, { status }),
  analytics: () => api.get<{ summary: { organizations: number; activeOrganizations: number; suspendedOrganizations: number; users: number }; growth: { month: string; organizations: number; users: number }[]; items: TenantItem[] }>("/api/v1/platform/tenants/analytics"),
  logout: () => api.post("/api/v1/platform/auth/logout"),
};
