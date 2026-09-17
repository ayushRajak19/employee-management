export interface SkillEvidenceTask {
  _id: unknown;
  taskId: string;
  name: string;
  description?: string;
  completionNote?: string;
  skillId?: string;
  skillName?: string;
  status: string;
  estimatedHours?: number;
  actualHours?: number;
  deadline: Date;
  completionDate?: Date;
  qualityRating?: number;
  reopenCount?: number;
}

export interface SkillEvidenceScore {
  skillId: string;
  name: string;
  category: string;
  tools?: string;
  description: string;
  rating: number;
}

const ignored = new Set(["and", "the", "for", "with", "from", "into", "using", "use", "skill", "skills", "apply", "effectively", "responsibilities", "tools", "business", "basic", "advanced"]);
const tokens = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9+#.]{3,}/g)?.filter((word) => !ignored.has(word)) ?? []);

export const buildSkillEvidence = (skill: SkillEvidenceScore, tasks: SkillEvidenceTask[], now = new Date()) => {
  const skillTokens = tokens(`${skill.name} ${skill.category} ${skill.tools ?? ""}`);
  const matched = tasks.filter((task) => {
    if (task.skillId) return task.skillId === skill.skillId;
    const taskTokens = tokens(`${task.name} ${task.description ?? ""} ${task.completionNote ?? ""} ${task.skillName ?? ""}`);
    return [...skillTokens].some((word) => taskTokens.has(word));
  });

  // Only reviewed work with tracked hours can change a person's demonstrated rating.
  const completed = matched.filter((task) => task.status === "COMPLETED" && task.qualityRating !== undefined && (task.actualHours ?? 0) > 0);
  const onTimeTasks = completed.filter((task) => task.completionDate && task.completionDate <= task.deadline);
  const reviewed = completed.filter((task) => task.qualityRating !== undefined);

  // Velocity Calculation: Estimated Hours / Actual Hours
  const velocityRatios = completed.map((task) => {
    const est = task.estimatedHours && task.estimatedHours > 0 ? task.estimatedHours : 1;
    const act = task.actualHours && task.actualHours > 0 ? task.actualHours : est;
    return Math.min(3.0, Math.max(0.2, est / act));
  });

  const avgVelocity = velocityRatios.length > 0 ? Number((velocityRatios.reduce((sum, v) => sum + v, 0) / velocityRatios.length).toFixed(2)) : 1.0;
  const onTimeRate = completed.length ? Math.round(onTimeTasks.length / completed.length * 100) : 0;
  const avgQuality = reviewed.length ? Number((reviewed.reduce((sum, task) => sum + (task.qualityRating ?? 0), 0) / reviewed.length).toFixed(1)) : null;
  const totalRework = completed.reduce((sum, task) => sum + (task.reopenCount ?? 0), 0);

  // Claim vs Reality Judge
  let credibilityStatus: "EXCEEDED" | "JUSTIFIED" | "GAP_DETECTED" | "UNTESTED" = "UNTESTED";
  let demonstratedRating = skill.rating;
  let message = "No completed, reviewed work with tracked hours yet to benchmark delivery.";

  if (completed.length > 0) {
    const onTimeFactor = onTimeRate >= 80 ? 1.0 : onTimeRate >= 50 ? 0.85 : 0.7;
    const qualityFactor = avgQuality ? avgQuality / 5.0 : 0.75;
    const reworkPenalty = Math.min(0.25, totalRework * 0.05);
    const executionFactor = Math.min(2.5, Math.max(0.2, avgVelocity * onTimeFactor * qualityFactor - reworkPenalty));

    if (skill.rating >= 8) {
      // High claim (8-10): Expectations are strict
      if (executionFactor >= 0.95 && avgVelocity >= 0.9) {
        credibilityStatus = avgVelocity >= 1.25 && (avgQuality ?? 5) >= 4 ? "EXCEEDED" : "JUSTIFIED";
        demonstratedRating = Math.min(10, Math.round(skill.rating * (1 + (avgVelocity - 1) * 0.1)));
        message = credibilityStatus === "EXCEEDED"
          ? `High mastery confirmed: Completed ${completed.length} task(s) ahead of time (${avgVelocity}x velocity).`
          : `Rating justified: Delivers on schedule with good quality.`;
      } else {
        credibilityStatus = "GAP_DETECTED";
        const gapPenalty = Math.round((skill.rating - executionFactor * 7) * 1.2);
        demonstratedRating = Math.max(1, Math.min(skill.rating - 1, skill.rating - Math.max(1, gapPenalty)));
        message = `Skill Reality Gap: Claimed ${skill.rating}/10, but delivered ${avgVelocity < 0.8 ? "slowly" : "with delays/rework"} (${avgVelocity}x velocity, ${onTimeRate}% on-time). Score adjusted to ${demonstratedRating}/10.`;
      }
    } else if (skill.rating >= 5) {
      // Mid claim (5-7)
      if (executionFactor >= 0.8) {
        credibilityStatus = avgVelocity >= 1.2 ? "EXCEEDED" : "JUSTIFIED";
        demonstratedRating = Math.min(10, Math.round(skill.rating + (avgVelocity > 1.2 ? 1 : 0)));
        message = `Rating justified: Consistent delivery (${avgVelocity}x velocity).`;
      } else {
        credibilityStatus = "GAP_DETECTED";
        demonstratedRating = Math.max(1, skill.rating - 1);
        message = `Skill gap detected: Struggling with delivery time (${avgVelocity}x velocity).`;
      }
    } else {
      // Low claim (1-4): Fast delivery gives high potential surge
      if (avgVelocity >= 1.1 && (avgQuality ?? 4) >= 3.5) {
        credibilityStatus = "EXCEEDED";
        demonstratedRating = Math.min(10, skill.rating + (avgVelocity >= 1.4 ? 3 : 2));
        message = `Fast learner surge: Performing above self-claim (${avgVelocity}x velocity). Demonstrated rating boosted to ${demonstratedRating}/10!`;
      } else {
        credibilityStatus = "JUSTIFIED";
        demonstratedRating = skill.rating;
        message = `Normal progress aligned with declared development level.`;
      }
    }
  }

  const required = skill.rating >= 8 ? 3 : skill.rating >= 6 ? 2 : 1;
  const evidencePoints = completed.length;

  let overallStatus: "EXCEEDED" | "JUSTIFIED" | "GAP_DETECTED" | "UNTESTED" | "IN_PROGRESS" | "NEEDS_EVIDENCE" = credibilityStatus;
  if (credibilityStatus !== "GAP_DETECTED" && evidencePoints < required) {
    overallStatus = matched.some((task) => !["COMPLETED", "CANCELLED"].includes(task.status))
      ? "IN_PROGRESS"
      : completed.length === 0
      ? "UNTESTED"
      : "NEEDS_EVIDENCE";
  }

  const justificationScore = completed.length === 0
    ? 0
    : credibilityStatus === "GAP_DETECTED"
    ? Math.max(20, Math.round((demonstratedRating / skill.rating) * 70))
    : credibilityStatus === "EXCEEDED"
    ? 100
    : Math.min(100, Math.round((evidencePoints / required) * 100));

  const displayMessage = overallStatus === "NEEDS_EVIDENCE"
    ? `Complete ${Math.max(1, required - evidencePoints)} more related task${required - evidencePoints === 1 ? "" : "s"} to support this rating.`
    : overallStatus === "IN_PROGRESS"
    ? "Related assigned work is in progress; completion will strengthen this rating."
    : message;

  return {
    status: overallStatus,
    credibilityStatus,
    demonstratedRating,
    velocityRatio: avgVelocity,
    justificationScore,
    matchedTasks: matched.length,
    completedTasks: completed.length,
    onTimeRate,
    averageQuality: avgQuality,
    message: displayMessage,
    tasks: matched.slice(0, 5).map((task) => ({
      id: String(task._id),
      taskId: task.taskId,
      name: task.name,
      status: task.status,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      onTime: task.status === "COMPLETED" && Boolean(task.completionDate && task.completionDate <= task.deadline),
      qualityRating: task.qualityRating,
      overdue: !["COMPLETED", "CANCELLED"].includes(task.status) && task.deadline < now
    }))
  };
};
