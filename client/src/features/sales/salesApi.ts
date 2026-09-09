import type { GeoNodeDto, SalesAnalytics, SalesEmployeeDto } from "@mobius-ems/shared";
import { api } from "@/api/client";

export interface SalesRecord {
  _id: string;
  name?: string;
  companyName?: string;
  primaryContactName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  market?: string;
  code?: string;
  status?: string;
  stage?: string;
  currency?: string;
  estimatedValue?: number;
  lifetimeRevenue?: number;
  amount?: number;
  revenueTarget?: number;
  leadTarget?: number;
  conversionTarget?: number;
  probability?: number;
  source?: string;
  customerType?: string;
  type?: string;
  reference?: string;
  lostReason?: string;
  lead?: string | { _id: string; name: string };
  customer?: string | { _id: string; name: string };
  sourceLead?: string | { _id: string; name: string };
  channelPartner?: string | { _id: string; name: string; code?: string };
  sourceOpportunity?: string | { _id: string; name: string };
  ownerEmployee?: string | { _id: string; firstName: string; lastName: string };
  employee?: string | { _id: string; firstName: string; lastName: string };
  territory?: string | { _id: string; name: string; code: string };
  periodStart?: string;
  periodEnd?: string;
  transactionDate?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt?: string;
}

export interface SalesTerritory {
  _id: string;
  name: string;
  code: string;
  parentTerritory?: string | { _id: string; name: string; code: string };
  ancestors: string[];
  status: string;
  ownerEmployee?: { _id: string; firstName: string; lastName: string; employeeId: string };
  effectiveFrom: string;
  effectiveTo?: string;
  coverageRules: { geoNodeIds: (string | GeoNodeDto)[] };
}

export interface EmployeeMapItem extends SalesEmployeeDto {
  markerColor: string;
  officeLocation?: string;
  profilePhotoKey?: string;
  salesTerritory?: { _id: string; name: string; code: string };
}

export const salesApi = {
  selfAnalytics: () => api.get<SalesAnalytics>("/api/v1/sales/me/analytics"),
  teamAnalytics: () => api.get<SalesAnalytics>("/api/v1/sales/team/analytics"),
  overviewAnalytics: () => api.get<SalesAnalytics>("/api/v1/sales/analytics/overview"),
  employeeAnalytics: (id: string) => api.get<SalesAnalytics>(`/api/v1/sales/employees/${id}/analytics`),
  employees: () => api.get<{ items: SalesEmployeeDto[] }>("/api/v1/sales/employees"),
  geography: () => api.get<{ items: GeoNodeDto[] }>("/api/v1/sales/geography/tree"),
  createGeography: (body: Record<string, unknown>) => api.post<{ item: GeoNodeDto }>("/api/v1/sales/geography", body),
  geoAnalytics: (id: string) => api.get<SalesAnalytics>(`/api/v1/sales/geography/${id}/analytics`),
  territories: () => api.get<{ items: SalesTerritory[] }>("/api/v1/sales/territories"),
  territoryAnalytics: (id: string) => api.get<SalesAnalytics>(`/api/v1/sales/territories/${id}/analytics`),
  records: (path: string) => api.get<{ items: SalesRecord[] }>(`/api/v1/sales/${path}`),
  createRecord: (path: string, body: Record<string, unknown>) => api.post<{ item: SalesRecord }>(`/api/v1/sales/${path}`, body),
  updateRecord: (path: string, id: string, body: Record<string, unknown>) => api.patch<{ item: SalesRecord }>(`/api/v1/sales/${path}/${id}`, body),
  createTerritory: (body: Record<string, unknown>) => api.post<{ item: SalesTerritory }>("/api/v1/sales/territories", body),
  assignTerritory: (body: Record<string, unknown>) => api.post<{ item: unknown }>("/api/v1/sales/territories/assignments", body),
  employeeMap: () => api.get<{ scope: "SELF" | "TEAM" | "ALL"; geography: GeoNodeDto[]; employees: EmployeeMapItem[] }>("/api/v1/employee-map"),
};
