import path from "node:path";
import { z } from "zod";
import { Applicant } from "../models/Applicant.js";
import { ResumeScreening } from "../models/ResumeScreening.js";
import { AppError } from "../utils/AppError.js";
import { complete } from "./llmService.js";
import { uploadApplicantPrivate } from "./storageService.js";
import { writeAudit } from "./auditService.js";

const assessmentSchema = z.object({ candidateName: z.string().trim().min(2).max(120), city: z.string().trim().max(120).nullish().transform((value) => value ?? null), state: z.string().trim().max(120).nullish().transform((value) => value ?? null), score: z.number().min(0).max(100), classification: z.enum(["STRONG_FIT", "POTENTIAL_FIT", "NOT_FIT"]), summary: z.string().trim().min(10).max(1200), writtenReason: z.string().trim().min(20).max(2400), matchedRequirements: z.array(z.string().trim().min(2).max(300)).max(12), missingRequirements: z.array(z.string().trim().min(2).max(300)).max(12), evidence: z.array(z.string().trim().min(2).max(400)).max(12) });
const parseJson = (text: string) => { const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]; const candidate = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1); try { return JSON.parse(candidate); } catch { throw new AppError("The AI returned an invalid screening result. Please try again.", 502, "AI_INVALID_RESPONSE"); } };
const system = `You are a careful resume-to-job-description screening assistant. Evaluate only evidence explicitly present in the supplied resume against the supplied job description. Never infer age, gender, religion, caste, ethnicity, marital status, disability, health, nationality, or other protected traits. Do not use names or contact details as scoring signals. Treat absent information as "not demonstrated", not proof that the candidate lacks it. Required qualifications matter more than preferred ones. Scores must be consistent: STRONG_FIT is 80-100, POTENTIAL_FIT is 60-79, and NOT_FIT is 0-59. Return only one valid JSON object with exactly these keys: candidateName, city, state, score, classification, summary, writtenReason, matchedRequirements, missingRequirements, evidence. city and state must come from the candidate's current/contact address or clearly stated current location; use null when not stated and never use location in scoring. writtenReason must clearly explain why the candidate is or is not suitable for this particular job. Evidence entries must be short resume-grounded facts. This is advisory screening for human review, never an automated hiring decision.`;
const fileNameCandidate = (name: string) => path.basename(name, path.extname(name)).replace(/[_-]+/g, " ").replace(/\b(cv|resume)\b/gi, "").trim() || "Unnamed candidate";
const parsePdf = async (buffer: Buffer) => { const { default: pdf } = await import("pdf-parse/lib/pdf-parse.js"); return pdf(buffer); };

export const runResumeScreening = async (input: { jobTitle: string; jobDescription: string; files: Express.Multer.File[]; actorId: string }) => {
  const results = []; let provider = ""; let model = "";
  for (const file of input.files) {
    if (file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") throw new AppError(`${file.originalname} is not a valid PDF`, 422, "INVALID_RESUME_FILE");
    const parsedPdf = await parsePdf(file.buffer).catch(() => { throw new AppError(`Text could not be extracted from ${file.originalname}. Upload a text-based PDF.`, 422, "PDF_TEXT_EXTRACTION_FAILED"); });
    const resumeText = parsedPdf.text.split(String.fromCharCode(0)).join(" ").trim();
    if (resumeText.length < 80) throw new AppError(`${file.originalname} has too little readable text. Scanned PDFs need OCR before upload.`, 422, "PDF_TEXT_TOO_SHORT");
    const generated = await complete({ system, user: `Job title: ${input.jobTitle}\n\nJob description:\n${input.jobDescription}\n\nResume file: ${file.originalname}\nResume text:\n${resumeText.slice(0, 24_000)}`, temperature: 0.1, maxTokens: 1_400 }); provider = generated.provider; model = generated.model;
    const assessment = assessmentSchema.safeParse(parseJson(generated.text)); if (!assessment.success) throw new AppError(`The screening result for ${file.originalname} was incomplete. Please try again.`, 502, "AI_INVALID_RESPONSE");
    const normalized = { ...assessment.data, candidateName: assessment.data.candidateName || fileNameCandidate(file.originalname), score: Math.round(assessment.data.score), classification: (assessment.data.score >= 80 ? "STRONG_FIT" : assessment.data.score >= 60 ? "POTENTIAL_FIT" : "NOT_FIT") as "STRONG_FIT" | "POTENTIAL_FIT" | "NOT_FIT" };
    const stored = await uploadApplicantPrivate(file.buffer, file.originalname, file.mimetype);
    const applicant = await Applicant.create({ name: normalized.candidateName, designation: input.jobTitle, jobCategory: input.jobTitle, city: normalized.city ?? undefined, state: normalized.state ?? undefined, originalName: file.originalname, storageProvider: stored.provider, storageKey: stored.key, format: stored.format, mimeType: file.mimetype, size: stored.size, uploadedBy: input.actorId });
    results.push({ applicant: applicant._id, ...normalized });
  }
  results.sort((a, b) => b.score - a.score);
  const screening = await ResumeScreening.create({ jobTitle: input.jobTitle, jobDescription: input.jobDescription, status: "COMPLETED", results, provider, model, createdBy: input.actorId });
  await writeAudit({ user: input.actorId, action: "RESUME_SCREENING_COMPLETED", entityType: "ResumeScreening", entityId: screening.id, newValue: { jobTitle: input.jobTitle, applicantCount: results.length, provider, model } });
  return screening;
};
export const listResumeScreenings = () => ResumeScreening.find().select("jobTitle status results.score results.classification createdAt").populate("createdBy", "name email").sort({ createdAt: -1 }).limit(30).lean();
export const getResumeScreening = async (id: string) => { const item = await ResumeScreening.findById(id).populate("createdBy", "name email").lean(); if (!item) throw new AppError("Screening not found", 404); return item; };
