import type { TaskDocument } from "../models/Task.js";
export const taskTransitions: Record<TaskDocument["status"], TaskDocument["status"][]> = { NOT_STARTED: ["IN_PROGRESS","BLOCKED","CANCELLED"], IN_PROGRESS: ["BLOCKED","IN_REVIEW","CANCELLED"], BLOCKED: ["IN_PROGRESS","CANCELLED"], IN_REVIEW: ["COMPLETED","REOPENED","IN_PROGRESS"], COMPLETED: ["REOPENED"], REOPENED: ["IN_PROGRESS","BLOCKED","IN_REVIEW","CANCELLED"], CANCELLED: [] };
export const canTransitionTask = (from: TaskDocument["status"], to: TaskDocument["status"]): boolean => taskTransitions[from].includes(to);
