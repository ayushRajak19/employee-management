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
  confirmedSaleAmount?: number;
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
  periodType?: string;
  periodStart?: string;
  periodEnd?: string;
  transactionDate?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  version?: number;
  targetGroupId?: string;
  changeReason?: string;
  createdAt?: string;
  justification?: string;
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

export interface TargetPerformanceDto {
  target: SalesRecord & {
    version?: number;
    targetGroupId?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    compensationRule?: {
      commissionRate: number;
      bonusThresholdPercentage?: number;
      bonusRate?: number;
      basePayAllocation?: number;
      currency?: string;
      ruleName?: string;
    };
  };
  performance: {
    officialTarget: number;
    actualAchievement: number;
    employeeCommitment: number | null;
    achievementPercentage: number;
    remainingOfficialTarget: number;
    remainingCommitment: number | null;
    daysRemaining: number;
    requiredDailyRunRate: number;
    requiredWeeklyRunRate: number;
    projectedAchievementPercentage: number;
    status: string;
    targetAmount: number;
    achievedAmount: number;
    remainingAmount: number;
    remainingPercentage: number;
    payout?: {
      commission: number;
      bonus: number;
      basePay: number;
      totalPayout: number;
    };
  };
  commitment?: {
    committedRevenue?: number;
    version?: number;
    status?: string;
  };
  reminderStatus?: {
    totalRemindersSent: number;
    lastReminderSentAt: string | null;
    lastReminderType: string | null;
    lastReminderMilestone: number | null;
    history?: {
      _id: string;
      reminderType: string;
      milestonePercentage?: number;
      achievementPercentage: number;
      remainingPercentage: number;
      title: string;
      body: string;
      sentAt: string;
      channel: string;
    }[];
  };
}

export const salesApi = {
  targetPerformance: () => api.get<{ items: TargetPerformanceDto[] }>("/api/v1/sales/target-performance/me"),
  teamTargetPerformance: () => api.get<{ items: TargetPerformanceDto[] }>("/api/v1/sales/target-performance/team"),
  targetVersions: (targetId: string) => api.get<{ items: (SalesRecord & { version: number; effectiveFrom: string; effectiveTo?: string })[] }>(`/api/v1/sales/targets/${targetId}/versions`),
  targetReminders: (targetId: string) => api.get<{ totalRemindersSent: number; lastReminderSentAt: string | null; history: unknown[] }>(`/api/v1/sales/targets/${targetId}/reminders`),
  triggerReminder: (targetId: string) => api.post<{ shouldSend: boolean; reason: string }>(`/api/v1/sales/targets/${targetId}/remind`, {}),
  commitment: (targetId: string, body: { committedRevenue: number }) => api.post(`/api/v1/sales/target-performance/${targetId}/commitment`, body),
  countries: () => api.get<{ items: { country: string; leads: number; customers: number; partners: number; converted: number; pipeline: Record<string, number>; revenue: Record<string, number> }[] }>("/api/v1/sales/countries"),
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

