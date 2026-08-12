/** Boundary for future AI-generated recommendations. Deterministic V1 scoring never calls this service. */
export const FORBIDDEN_AI_DECISIONS = ["termination", "promotion", "salary", "disciplinary_action"] as const;
export interface RecommendationRequest { purpose: "DEVELOPMENT_SUMMARY" | "SKILL_GAP" | "TRAINING" | "PROJECT_MATCH_EXPLANATION" | "CAPABILITY_SUMMARY" | "TREND_EXPLANATION"; factualEvidence: Record<string, string | number | boolean | string[]> }
export interface RecommendationResult { label: "AI_RECOMMENDATION"; summary: string; evidenceKeys: string[]; requiresHumanDecision: true }
export interface AiRecommendationProvider { recommend(input: RecommendationRequest): Promise<RecommendationResult> }
export class DisabledAiRecommendationProvider implements AiRecommendationProvider { async recommend(): Promise<RecommendationResult> { throw new Error("AI recommendations are not enabled. V1 uses deterministic, explainable calculations only."); } }
export const aiRecommendationProvider: AiRecommendationProvider = new DisabledAiRecommendationProvider();
