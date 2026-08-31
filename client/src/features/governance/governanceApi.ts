import { api } from "@/api/client";
export interface DocumentItem {
  _id: string;
  employee: { firstName: string; lastName: string; employeeId: string };
  category: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}
export interface ResumeItem {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: { _id: string; name: string; code: string };
    designation?: { name: string };
  };
  originalName: string;
  size: number;
  createdAt: string;
  uploadedBy?: { name: string };
}
export interface ApplicantItem {
  _id: string;
  name: string;
  designation: string;
  jobCategory?: string;
  city?: string;
  state?: string;
  matchScore?: number;
  originalName: string;
  size: number;
  createdAt: string;
  uploadedBy?: { name: string; email: string };
}
export type FitClassification = "STRONG_FIT" | "POTENTIAL_FIT" | "NOT_FIT";
export interface ScreeningResult {
  applicant: string;
  candidateName: string;
  score: number;
  classification: FitClassification;
  summary: string;
  writtenReason: string;
  matchedRequirements: string[];
  missingRequirements: string[];
  evidence: string[];
}
export interface ResumeScreeningItem {
  _id: string;
  jobTitle: string;
  jobDescription: string;
  status: "COMPLETED";
  results: ScreeningResult[];
  provider: string;
  model: string;
  createdAt: string;
  createdBy?: { name: string; email: string };
}
export interface JobDescriptionItem {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: { name: string; email: string };
}
export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
}
export interface AuditItem {
  _id: string;
  user?: { name: string; email: string };
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
  ipAddress?: string;
}
export const governanceApi = {
  jobDescriptions: () =>
    api.get<{ items: JobDescriptionItem[] }>(
      "/api/v1/governance/job-descriptions",
    ),
  createJobDescription: (body: { title: string; description: string }) =>
    api.post<{ item: JobDescriptionItem }>(
      "/api/v1/governance/job-descriptions",
      body,
    ),
  updateJobDescription: (
    id: string,
    body: { title: string; description: string },
  ) =>
    api.patch<{ item: JobDescriptionItem }>(
      `/api/v1/governance/job-descriptions/${id}`,
      body,
    ),
  deleteJobDescription: (id: string) =>
    api.delete(`/api/v1/governance/job-descriptions/${id}`),
  documents: () =>
    api.get<{ items: DocumentItem[] }>("/api/v1/governance/documents"),
  upload: (data: FormData) => api.upload("/api/v1/governance/documents", data),
  resumes: (department?: string) =>
    api.get<{ items: ResumeItem[] }>(
      `/api/v1/governance/resumes${department ? `?department=${encodeURIComponent(department)}` : ""}`,
    ),
  uploadResume: (data: FormData) =>
    api.upload("/api/v1/governance/resumes", data),
  applicants: () =>
    api.get<{ items: ApplicantItem[] }>("/api/v1/governance/applicants"),
  createApplicant: (data: FormData) =>
    api.upload("/api/v1/governance/applicants", data),
  applicantCv: (id: string) =>
    api.get<{ url: string }>(`/api/v1/governance/applicants/${id}/cv`),
  deleteApplicant: (id: string) =>
    api.delete(`/api/v1/governance/applicants/${id}`),
  screenResumes: (data: FormData) =>
    api.upload<{ item: ResumeScreeningItem }>(
      "/api/v1/governance/resume-screenings",
      data,
    ),
  resumeScreenings: () =>
    api.get<{ items: ResumeScreeningItem[] }>(
      "/api/v1/governance/resume-screenings",
    ),
  resumeScreening: (id: string) =>
    api.get<{ item: ResumeScreeningItem }>(
      `/api/v1/governance/resume-screenings/${id}`,
    ),
  download: (id: string) =>
    api.get<{ url: string; expiresInSeconds: number }>(
      `/api/v1/governance/documents/${id}/download`,
    ),
  deleteDocument: (id: string) =>
    api.delete(`/api/v1/governance/documents/${id}`),
  archive: (id: string) => api.delete(`/api/v1/governance/documents/${id}`),
  notifications: () =>
    api.get<{ items: NotificationItem[] }>("/api/v1/governance/notifications"),
  read: (id: string) =>
    api.patch(`/api/v1/governance/notifications/${id}/read`),
  audit: () =>
    api.get<{ items: AuditItem[] }>("/api/v1/governance/audit?page=1"),
  report: (type: string) =>
    api.get<{ type: string; generatedAt: string; rows: unknown[] }>(
      `/api/v1/governance/reports?type=${type}`,
    ),
  search: (q: string) =>
    api.get<
      Record<
        string,
        {
          _id: string;
          name?: string;
          firstName?: string;
          lastName?: string;
          employeeId?: string;
          code?: string;
          taskId?: string;
        }[]
      >
    >(`/api/v1/governance/search?q=${encodeURIComponent(q)}`),
};
