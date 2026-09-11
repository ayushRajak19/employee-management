export interface SkillEvidenceTask {
  _id: unknown;
  taskId: string;
  name: string;
  description?: string;
  completionNote?: string;
  status: string;
  deadline: Date;
  completionDate?: Date;
  qualityRating?: number;
}

export interface SkillEvidenceScore {
  skillId: string;
  name: string;
  category: string;
  tools: string;
  description: string;
  rating: number;
}

const ignored = new Set(["and", "the", "for", "with", "from", "into", "using", "use", "skill", "skills", "apply", "effectively", "responsibilities", "tools", "business", "basic", "advanced"]);
const tokens = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9+#.]{3,}/g)?.filter((word) => !ignored.has(word)) ?? []);

export const buildSkillEvidence = (skill: SkillEvidenceScore, tasks: SkillEvidenceTask[], now = new Date()) => {
  const skillTokens = tokens(`${skill.name} ${skill.category} ${skill.tools}`);
  const matched = tasks.filter((task) => {
    const taskTokens = tokens(`${task.name} ${task.description ?? ""} ${task.completionNote ?? ""}`);
    return [...skillTokens].some((word) => taskTokens.has(word));
  });
  const completed = matched.filter((task) => task.status === "COMPLETED");
  const onTime = completed.filter((task) => task.completionDate && task.completionDate <= task.deadline);
  const reviewed = completed.filter((task) => task.qualityRating !== undefined);
  const required = skill.rating >= 8 ? 3 : skill.rating >= 6 ? 2 : 1;
  const evidencePoints = completed.length + reviewed.filter((task) => (task.qualityRating ?? 0) >= 4).length;
  const status = evidencePoints >= required ? "JUSTIFIED" : matched.some((task) => !["COMPLETED", "CANCELLED"].includes(task.status)) ? "IN_PROGRESS" : "NEEDS_EVIDENCE";
  return {
    status,
    justificationScore: Math.min(100, Math.round(evidencePoints / required * 100)),
    matchedTasks: matched.length,
    completedTasks: completed.length,
    onTimeRate: completed.length ? Math.round(onTime.length / completed.length * 100) : 0,
    averageQuality: reviewed.length ? Number((reviewed.reduce((sum, task) => sum + (task.qualityRating ?? 0), 0) / reviewed.length).toFixed(1)) : null,
    message: status === "JUSTIFIED" ? "Your work record supports this self-rating." : status === "IN_PROGRESS" ? "Related assigned work is in progress; completion will strengthen this rating." : `Complete ${Math.max(1, required - evidencePoints)} more related task${required - evidencePoints === 1 ? "" : "s"} to support this rating.`,
    tasks: matched.slice(0, 5).map((task) => ({ id: String(task._id), taskId: task.taskId, name: task.name, status: task.status, onTime: task.status === "COMPLETED" && Boolean(task.completionDate && task.completionDate <= task.deadline), qualityRating: task.qualityRating, overdue: !["COMPLETED", "CANCELLED"].includes(task.status) && task.deadline < now }))
  };
};
