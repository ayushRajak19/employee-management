import { tenantModel } from "../tenancy/tenantModel.js";
import { Schema, type Types } from "mongoose";

export const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
export type AssessmentDifficulty = typeof DIFFICULTIES[number];

export const ASSESSMENT_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;
export type AssessmentStatus = typeof ASSESSMENT_STATUSES[number];

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: "MCQ" | "OPEN";
  options: string[];
  correctOptionIndex?: number;
  explanation?: string;
  points: number;
}

export interface AssessmentAnswer {
  questionId: string;
  selectedOption?: number;
  textAnswer?: string;
  isCorrect?: boolean;
  earnedPoints?: number;
}

export interface AssessmentDocument {
  name: string;
  skill?: Types.ObjectId;
  skillName?: string;
  jobDescription?: string;
  difficulty: AssessmentDifficulty;
  maximumScore: number;
  passingScore: number;
  timeLimitMinutes: number;
  assignedEmployee?: Types.ObjectId;
  assignedCandidate?: Types.ObjectId;
  assignedBy: Types.ObjectId;
  status: AssessmentStatus;
  questions: AssessmentQuestion[];
  answers?: AssessmentAnswer[];
  attemptDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  score?: number;
  percentage?: number;
  result?: "PENDING" | "PASSED" | "FAILED";
}

const questionSchema = new Schema<AssessmentQuestion>({
  id: { type: String, required: true },
  question: { type: String, required: true },
  type: { type: String, enum: ["MCQ", "OPEN"], default: "MCQ" },
  options: [{ type: String }],
  correctOptionIndex: { type: Number },
  explanation: { type: String },
  points: { type: Number, default: 10 }
}, { _id: false });

const answerSchema = new Schema<AssessmentAnswer>({
  questionId: { type: String, required: true },
  selectedOption: { type: Number },
  textAnswer: { type: String },
  isCorrect: { type: Boolean },
  earnedPoints: { type: Number, default: 0 }
}, { _id: false });

const schema = new Schema<AssessmentDocument>({
  name: { type: String, required: true, maxlength: 160 },
  skill: { type: Schema.Types.ObjectId, ref: "Skill", required: false, index: true },
  skillName: { type: String, maxlength: 160 },
  jobDescription: { type: String, maxlength: 10000 },
  difficulty: { type: String, enum: DIFFICULTIES, required: true, default: "INTERMEDIATE" },
  maximumScore: { type: Number, required: true, min: 1 },
  passingScore: { type: Number, required: true, min: 0 },
  timeLimitMinutes: { type: Number, required: true, min: 1, max: 1440, default: 30 },
  assignedEmployee: { type: Schema.Types.ObjectId, ref: "Employee", index: true },
  assignedCandidate: { type: Schema.Types.ObjectId, ref: "AssessmentCandidate", index: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ASSESSMENT_STATUSES, default: "PENDING", index: true },
  questions: { type: [questionSchema], default: [] },
  answers: { type: [answerSchema], default: [] },
  attemptDate: Date,
  startedAt: Date,
  completedAt: Date,
  score: { type: Number, min: 0 },
  percentage: { type: Number, min: 0, max: 100 },
  result: { type: String, enum: ["PENDING", "PASSED", "FAILED"], default: "PENDING", index: true }
}, { timestamps: true });

schema.index({ assignedEmployee: 1, status: 1, createdAt: -1 });
schema.index({ assignedCandidate: 1, status: 1, createdAt: -1 });
schema.pre("validate", function () { if (Boolean(this.assignedEmployee) === Boolean(this.assignedCandidate)) this.invalidate("assignedEmployee", "Assign exactly one employee or applicant"); });

export const Assessment = tenantModel<AssessmentDocument>("Assessment", schema);
