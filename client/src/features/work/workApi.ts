import { api } from "@/api/client";
export interface Project { _id: string; name: string; code: string; status: string; priority: string; progress: number; department: { _id: string; name: string }; projectManager: { _id: string; firstName: string; lastName: string } }
export interface Task { _id: string; taskId: string; name: string; description?: string; project: { _id: string; name: string; code: string }; assignedEmployee: { _id: string; firstName: string; lastName: string }; assignmentSource?: "MANAGER_ASSIGNED" | "SELF_REPORTED"; verbalAssigner?: string; priority: string; complexity: string; potentialXp: number; estimatedHours: number; actualHours?: number; deadline: string; status: string; completionNote?: string; deliverableUrl?: string; businessImpact?: string; qualityRating?: number; reviewComment?: string; reopenCount: number; blocker?: { reason: string; comment?: string; external: boolean } }
export interface Gamification { currentLevel: number; currentLevelXp: number; xpForNextLevel: number; totalLifetimeXp: number; streakDays: number; completedTasksCount: number; tierName: string; xpToNextLevel: number; progressPercent: number; recentAchievement: { badgeKey: string; name: string; description: string; icon: string; awardedAt: string } | null }
export interface TaskMetrics { total: number; open: number; overdue: number; onTimeRate: number; reworkRate: number; averageQuality: number }
export interface TaskActivity { _id: string; action: string; oldValue?: unknown; newValue?: unknown; performedBy: { name: string }; createdAt: string }
export interface VoiceOption { id: string; label: string; detail?: string; status?: string }
export interface VoiceDraft { action: "CREATE_TASK" | "UPDATE_STATUS"; name?: string; description?: string; project?: string; assignedEmployee?: string; assigneeHint?: string; verbalAssigner?: string; priority?: string; complexity?: string; estimatedHours?: number; deadline?: string; task?: string; status?: string; actualHours?: number; completionNote?: string; blockerReason?: string; blockerComment?: string }
export interface VoicePreview { command: { id: string; transcript: string; language?: string; durationSeconds?: number; confidence: number; status: string }; draft: VoiceDraft; drafts: VoiceDraft[]; options: { projects: VoiceOption[]; employees: VoiceOption[]; tasks: VoiceOption[] } }
export interface VoiceHistory { _id: string; transcript: string; intent: string; confidence: number; status: string; actor: { name: string; email: string }; task?: { taskId: string; name: string; status: string }; tasks?: { taskId: string; name: string; status: string }[]; createdAt: string }
export const workApi = {
  projects: () => api.get<{ items: Project[] }>("/api/v1/work/projects"), createProject: (body: unknown) => api.post("/api/v1/work/projects", body),
  tasks: () => api.get<{ items: Task[] }>("/api/v1/work/tasks"), createTask: (body: unknown) => api.post("/api/v1/work/tasks", body), createManualTask: (body: unknown) => api.post("/api/v1/work/tasks/manual", body),
  gamification: () => api.get<Gamification>("/api/v1/work/gamification"),
  transition: (id: string, body: unknown) => api.patch(`/api/v1/work/tasks/${id}/status`, body), review: (id: string, body: unknown) => api.patch(`/api/v1/work/tasks/${id}/review`, body), activity: (id: string) => api.get<{ items: TaskActivity[] }>(`/api/v1/work/tasks/${id}/activity`), metrics: () => api.get<TaskMetrics>("/api/v1/work/tasks/metrics"),
  reassign: (id: string, assignedEmployee: string) => api.patch(`/api/v1/work/tasks/${id}/reassign`, { assignedEmployee }),
  remove: (id: string) => api.delete(`/api/v1/work/tasks/${id}`),
  voicePreview: (audio: Blob, language = "auto") => { const body = new FormData(); body.append("audio", audio, "voice-task.webm"); body.append("language", language); body.append("timezoneOffsetMinutes", String(new Date().getTimezoneOffset())); return api.upload<VoicePreview>("/api/v1/work/voice/preview", body); },
  voicePreviewFile: (file: File, language = "auto") => { const body = new FormData(); body.append("audio", file); body.append("language", language); body.append("timezoneOffsetMinutes", String(new Date().getTimezoneOffset())); return api.upload<VoicePreview>("/api/v1/work/voice/preview", body); },
  voicePreviewText: (transcript: string, language = "auto") => api.post<VoicePreview>("/api/v1/work/voice/preview-text", { transcript, language, timezoneOffsetMinutes: new Date().getTimezoneOffset() }),
  voiceConfirm: (id: string, body: VoiceDraft | { drafts: VoiceDraft[] }) => api.post(`/api/v1/work/voice/${id}/confirm`, body),
  voiceCancel: (id: string) => api.patch(`/api/v1/work/voice/${id}/cancel`),
  voiceHistory: () => api.get<{ items: VoiceHistory[] }>("/api/v1/work/voice/history")
};
