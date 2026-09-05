import { api } from "@/api/client";

export type WorkflowStatus = "DRAFT" | "ACTIVE" | "PAUSED";
export interface EmailWorkflowItem { _id: string; name: string; audience: string; subject: string; message: string; followUp: boolean; delayDays: number; followUpSubject?: string; followUpMessage?: string; status: WorkflowStatus; createdAt: string }
export interface VendorContactItem { _id: string; name: string; companyName: string; email: string; source: string; consentAt: string; status: "ACTIVE" | "REPLIED" | "UNSUBSCRIBED" | "BOUNCED" | "BLOCKED"; repliedAt?: string; createdAt: string }
export interface AutomationConfiguration { configured: boolean; senderEmail: string | null; senderName: string; replyToEmail: string | null; webhookConfigured: boolean; webhookUrl: string; dailyLimit: number }
export interface AutomationSummary { workflows: number; active: number; contacts: number; accepted: number; sent: number; delivered: number; opened: number; clicked: number; bounced: number; replies: number }
export interface EmailDeliveryItem { _id: string; recipientEmail: string; subject: string; status: string; lastEventAt: string; createdAt: string; step: number; lastError?: string | null }
export interface WorkflowInput { name: string; audience: string; subject: string; message: string; followUp: boolean; delayDays: number; followUpSubject?: string; followUpMessage?: string }
export interface VendorInput { name: string; companyName: string; email: string; source: string; consentAt: string }

export const emailAutomationApi = {
  configuration: () => api.get<AutomationConfiguration>("/api/v1/email-automation/configuration"),
  checkConnection: () => api.post<{ connected: boolean; accountEmail: string | null; companyName: string | null }>("/api/v1/email-automation/connection/test"),
  registerWebhook: () => api.post<{ id: number; created: boolean }>("/api/v1/email-automation/connection/webhook"),
  sendTest: (recipient: string) => api.post<{ messageId: string }>("/api/v1/email-automation/test-email", { recipient }),
  summary: () => api.get<AutomationSummary>("/api/v1/email-automation/summary"),
  deliveries: () => api.get<{ items: EmailDeliveryItem[] }>("/api/v1/email-automation/deliveries"),
  workflows: () => api.get<{ items: EmailWorkflowItem[] }>("/api/v1/email-automation/workflows"),
  createWorkflow: (body: WorkflowInput) => api.post<{ item: EmailWorkflowItem }>("/api/v1/email-automation/workflows", body),
  updateWorkflow: (id: string, body: Partial<WorkflowInput>) => api.patch<{ item: EmailWorkflowItem }>(`/api/v1/email-automation/workflows/${id}`, body),
  deleteWorkflow: (id: string) => api.delete<Record<string, never>>(`/api/v1/email-automation/workflows/${id}`),
  activateWorkflow: (id: string) => api.post<{ item: EmailWorkflowItem }>(`/api/v1/email-automation/workflows/${id}/activate`),
  pauseWorkflow: (id: string) => api.post<{ item: EmailWorkflowItem }>(`/api/v1/email-automation/workflows/${id}/pause`),
  contacts: () => api.get<{ items: VendorContactItem[] }>("/api/v1/email-automation/contacts"),
  addContacts: (contacts: VendorInput[]) => api.post<{ created: number; updated: number }>("/api/v1/email-automation/contacts", { contacts }),
  setContactStatus: (id: string, status: VendorContactItem["status"]) => api.patch<{ item: VendorContactItem }>(`/api/v1/email-automation/contacts/${id}/status`, { status }),
};
