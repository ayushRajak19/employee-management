import { api } from "@/api/client";

export type TrackerType = "WORK" | "MEETING" | "LEARNING" | "FOLLOW_UP" | "PERSONAL" | "OTHER";
export type TrackerPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TrackerStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export interface TrackerEmployee { _id: string; firstName: string; lastName: string; employeeId: string; employmentType?: string; department?: { name: string; code: string }; designation?: { name: string; code: string } }
export interface DailyTodo { _id: string; date: string; title: string; type?: TrackerType; priority?: TrackerPriority; durationMinutes?: number; deadline?: string; status?: TrackerStatus; completed: boolean; completedAt?: string; createdAt: string; employee?: TrackerEmployee }
export interface TrackerInput { date: string; title: string; type: TrackerType; priority: TrackerPriority; durationMinutes: number; deadline?: string }

export const todoApi = {
  list: (filters: { date?: string; employee?: string; status?: TrackerStatus } | string) => {
    const input = typeof filters === "string" ? { date: filters } : filters;
    const params = new URLSearchParams();
    if (input.date) params.set("date", input.date);
    if (input.employee) params.set("employee", input.employee);
    if (input.status) params.set("status", input.status);
    return api.get<{ items: DailyTodo[] }>(`/api/v1/todos?${params}`);
  },
  create: (body: TrackerInput) => api.post<{ item: DailyTodo }>("/api/v1/todos", body),
  update: (id: string, body: Partial<TrackerInput> & { status?: TrackerStatus; completed?: boolean }) => api.patch<{ item: DailyTodo }>(`/api/v1/todos/${id}`, body),
  remove: (id: string) => api.delete<{ item: DailyTodo }>(`/api/v1/todos/${id}`)
};
