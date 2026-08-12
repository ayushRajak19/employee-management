import { api } from "@/api/client";
import type { EmployeeRow } from "@/features/organization/types";
import type { RoleSkillAssessment } from "@/features/skills/skillApi";

export interface EmployeeList { items: EmployeeRow[]; pagination: { page: number; limit: number; total: number; pages: number } }
export interface CreateEmployeeInput { firstName: string; lastName: string; officialEmail: string; phone?: string; department: string; team?: string; designation: string; reportingManager?: string; dateOfJoining: string; employmentType: string; officeLocation?: string; role: string; status: string }
export interface Employee360 {
  employee: EmployeeRow & { dateOfJoining: string; employmentType: string; officeLocation?: string; professionalSummary?: string; personal?: { personalEmail?: string; address?: string; emergencyContact?: string } };
  skills: { _id: string; skill: { name: string; category: string }; selfRating: number; verifiedRating?: number; verificationStatus: string }[];
  roleSkillAssessment: RoleSkillAssessment | null;
  tasks: { _id: string; taskId: string; name: string; status: string; priority: string; deadline: string; qualityRating?: number }[];
  projects: { _id: string; name: string; code: string; status: string; progress: number }[];
  goals: { _id: string; name: string; progress: number; status: string }[];
  kpis: { _id: string; kpi: { name: string; unit: string; target: number }; actual: number; achievement: number }[];
  performance: { _id: string; period: string; totalScore: number; classification: string }[];
  training: { _id: string; training: { name: string }; status: string }[];
  documents: { _id: string; category: string; originalName: string }[];
  timeline: { _id: string; type: string; title: string; description?: string; occurredAt: string }[];
  recognition: { _id: string; badge: string; explanation: string }[];
}
export type MyEmployee = EmployeeRow & { onboardingStep: number; professionalSummary?: string; previousExperience?: { company: string; role: string; startDate: string }[]; personal?: { personalEmail?: string; address?: string; emergencyContact?: string } };

export const employeeApi = {
  list: (params: URLSearchParams) => api.get<EmployeeList>(`/api/v1/employees?${params}`),
  create: (body: CreateEmployeeInput) => api.post<{ employee: EmployeeRow; temporaryCredentials: { email: string; password: string } }>("/api/v1/employees", body),
  me: () => api.get<{ employee: MyEmployee }>("/api/v1/employees/me"),
  updateMe: (body: unknown) => api.patch<{ employee: MyEmployee }>("/api/v1/employees/me/profile", body),
  uploadProfilePhoto: (file: File) => { const body = new FormData(); body.append("photo", file); return api.upload<{ employee: MyEmployee }>("/api/v1/employees/me/profile-photo", body); },
  onboarding: (body: unknown) => api.patch<{ employee: EmployeeRow }>("/api/v1/employees/me/onboarding", body),
  profile: (id: string) => api.get<Employee360>(`/api/v1/employees/${id}`),
  update: (id: string, body: unknown) => api.patch<{ employee: EmployeeRow }>(`/api/v1/employees/${id}`, body),
  deactivate: (id: string) => api.delete<Record<string, never>>(`/api/v1/employees/${id}`)
};
