import { api } from "@/api/client";
export interface AiSummary { kind: "CONTRIBUTION" | "PERFORMANCE"; summary: string; provider: string; model: string; generatedAt: string; advisory?: true }
export interface AiAnswer { answer: string; provider: string; model: string; generatedAt: string }
export interface AiChatMessage { role: "user" | "assistant"; content: string }
export interface AiJoke { joke: string; provider: string; model: string; cached: boolean }
export const aiApi = {
  configuration: () => api.get<{ provider: string; model: string; configured: boolean }>("/api/v1/ai/configuration"),
  ask: ({ question, employeeId, history }: { question: string; employeeId?: string; history?: AiChatMessage[] }) => api.post<AiAnswer>("/api/v1/ai/assistant", { question, employeeId, history }),
  employeeSummaries: (employee: string) => api.get<{ items: AiSummary[] }>(`/api/v1/ai/employees/${employee}/summaries`),
  contributionSummary: (employee: string) => api.post<AiSummary>(`/api/v1/ai/employees/${employee}/contribution-summary`),
  performanceSummary: (employee: string) => api.post<AiSummary>(`/api/v1/ai/employees/${employee}/performance-summary`),
  joke: (index: number) => api.get<AiJoke>(`/api/v1/ai/joke?index=${index}`)
};
