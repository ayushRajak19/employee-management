import { api } from "@/api/client";

export interface TenantItem {
  _id: string;
  name: string;
  slug: string;
  status: "PROVISIONING" | "ACTIVE" | "SUSPENDED";
  plan: "STANDARD" | "ENTERPRISE";
  activatedAt?: string;
  createdAt: string;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  plan: "STANDARD" | "ENTERPRISE";
  adminName: string;
  adminEmail: string;
  temporaryPassword: string;
}

export const tenantApi = {
  list: () => api.get<{ items: TenantItem[] }>("/api/v1/platform/tenants"),
  create: (body: CreateTenantInput) => api.post<{ item: TenantItem }>("/api/v1/platform/tenants", body),
  updateStatus: (id: string, status: "ACTIVE" | "SUSPENDED") => api.patch<{ item: TenantItem }>(`/api/v1/platform/tenants/${id}/status`, { status }),
};

