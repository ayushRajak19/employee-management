import { api } from "@/api/client";
export interface DailyTodo { _id: string; date: string; title: string; completed: boolean; completedAt?: string; createdAt: string }
export const todoApi = {
  list: (date: string) => api.get<{ items: DailyTodo[] }>(`/api/v1/todos?date=${date}`),
  create: (body: { date: string; title: string }) => api.post<{ item: DailyTodo }>("/api/v1/todos", body),
  update: (id: string, body: { title?: string; completed?: boolean }) => api.patch<{ item: DailyTodo }>(`/api/v1/todos/${id}`, body),
  remove: (id: string) => api.delete<{ item: DailyTodo }>(`/api/v1/todos/${id}`)
};
