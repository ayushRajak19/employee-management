import path from "node:path";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { z } from "zod";
import { AppError } from "../utils/AppError.js";
import { complete } from "./llmService.js";
import { createApplicant } from "./governanceService.js";

const detailsSchema = z.object({
  candidateName: z.string().trim().min(2).max(120),
  designation: z.string().trim().min(2).max(120)
});

const system = `Extract basic applicant details from resume text. Return only one valid JSON object with exactly these keys: candidateName and designation. candidateName must be the person's full name as written in the resume. designation must be their most recent or most clearly demonstrated professional role, not a company name and not a list of skills. Do not infer protected or sensitive characteristics. Do not add facts that are absent from the resume.`;

const parseJson = (text: string, fileName: string) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const candidate = fenced ?? (start >= 0 && end > start ? text.slice(start, end + 1) : text);
  try { return JSON.parse(candidate); }
  catch { throw new AppError(`AI could not read applicant details from ${fileName}. Please try again.`, 502, "AI_INVALID_RESPONSE"); }
};

const fallbackName = (fileName: string) => path.basename(fileName, path.extname(fileName)).replace(/[_-]+/g, " ").replace(/\b(cv|resume)\b/gi, "").replace(/\s+/g, " ").trim();

const extractDetails = async (file: Express.Multer.File) => {
  if (file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") throw new AppError(`${file.originalname} is not a valid PDF`, 422, "INVALID_APPLICANT_CV");
  const parsed = await pdf(file.buffer).catch(() => { throw new AppError(`Text could not be extracted from ${file.originalname}. Upload a text-based PDF.`, 422, "PDF_TEXT_EXTRACTION_FAILED"); });
  const resumeText = parsed.text.split(String.fromCharCode(0)).join(" ").trim();
  if (resumeText.length < 80) throw new AppError(`${file.originalname} has too little readable text. Scanned PDFs need OCR before upload.`, 422, "PDF_TEXT_TOO_SHORT");
  const generated = await complete({ system, user: `Resume file: ${file.originalname}\n\nResume text:\n${resumeText.slice(0, 24_000)}`, temperature: 0, maxTokens: 300 });
  const details = detailsSchema.safeParse(parseJson(generated.text, file.originalname));
  if (!details.success) throw new AppError(`AI returned incomplete applicant details for ${file.originalname}. Please try again.`, 502, "AI_INVALID_RESPONSE");
  return { name: details.data.candidateName || fallbackName(file.originalname), designation: details.data.designation };
};

export const importApplicantResumes = async (files: Express.Multer.File[], actorId: string) => {
  const extracted = [];
  for (const file of files) extracted.push({ file, metadata: await extractDetails(file) });
  const applicants = [];
  for (const item of extracted) applicants.push(await createApplicant(item.file, item.metadata, actorId));
  return applicants;
};
