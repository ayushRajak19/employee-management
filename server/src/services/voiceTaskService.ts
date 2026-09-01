import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Employee } from "../models/Employee.js";
import { Task, type TaskDocument } from "../models/Task.js";
import { VoiceCommand } from "../models/VoiceCommand.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";
import { createManualTask, createTask, listProjects, listTasks, transitionTask } from "./workService.js";

type Actor = { id: string; role: string; permissions: string[] };
type Option = { id: string; label: string; detail?: string; status?: string };
type VoiceDraft = {
  action: "CREATE_TASK" | "UPDATE_STATUS";
  name?: string;
  description?: string;
  project?: string;
  assignedEmployee?: string;
  verbalAssigner?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  complexity?: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
  estimatedHours?: number;
  deadline?: string;
  task?: string;
  status?: TaskDocument["status"];
  actualHours?: number;
  completionNote?: string;
  blockerReason?: NonNullable<TaskDocument["blocker"]>["reason"];
  blockerComment?: string;
};

const audioExtensions: Record<string, string> = {
  "audio/webm": ".webm", "audio/ogg": ".ogg", "audio/wav": ".wav", "audio/x-wav": ".wav",
  "audio/mpeg": ".mp3", "audio/mp4": ".mp4", "audio/x-m4a": ".m4a"
};

const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
const words = (value: string) => new Set(normalize(value).split(" ").filter((word) => word.length > 2));
const overlap = (left: string, right: string) => {
  const a = words(left); const b = words(right); if (!a.size || !b.size) return 0;
  return [...a].filter((word) => b.has(word)).length / Math.max(a.size, b.size);
};
const containsAny = (text: string, phrases: readonly string[]) => phrases.some((phrase) => text.includes(normalize(phrase)));
const STATUS_PHRASES = {
  complete: ["complete", "completed", "finished", "done", "submitted", "पूरा", "पूर्ण", "समाप्त", "खत्म", "हो गया", "সম্পন্ন", "শেষ", "முடித்த", "முடிந்தது", "பூர்த்தி", "పూర్తి", "పూర్తయింది", "ముగిసింది", "पूर्ण केले", "संपले", "પૂર્ણ", "સમાપ્ત", "ಪೂರ್ಣ", "ಮುಗಿದಿದೆ", "ಪೂರ್ಣವಾಗಿದೆ", "പൂർത്തിയായി", "കഴിഞ്ഞു", "ਪੂਰਾ", "ਮੁਕੰਮਲ", "ਮੁਕੰਮਲ ਹੋਇਆ", "مکمل", "ختم", "ہو گیا"],
  start: ["start", "started", "begin", "in progress", "शुरू", "आरंभ", "চালু", "শুরু", "தொடங்கு", "ஆரம்பம்", "ప్రారంభ", "सुरू", "શરૂ", "ಪ್ರಾರಂಭ", "തുടങ്ങി", "ਸ਼ੁਰੂ", "شروع"],
  blocked: ["block", "blocked", "stuck", "waiting", "रुका", "अटका", "बाधित", "আটকে", "தடை", "சிக்கி", "ఆగిపోయింది", "अडकले", "અટક્યું", "ಸಿಲುಕಿದೆ", "തടസ്സം", "ਅਟਕਿਆ", "رکا", "پھنسا"],
  reopen: ["reopen", "open again", "फिर खोल", "दोबारा खोल", "আবার খুল", "மீண்டும் திற", "మళ్లీ తెర", "पुन्हा उघड", "ફરી ખોલ", "ಮತ್ತೆ ತೆರ", "വീണ്ടും തുറ", "ਦੁਬਾਰਾ ਖੋਲ੍ਹ", "دوبارہ کھول"],
  cancel: ["cancel", "cancelled", "रद्द", "বাতিল", "ரத்து", "రద్దు", "रद्द करा", "રદ", "ರದ್ದು", "റദ്ദാക്ക", "ਰੱਦ", "منسوخ"]
} as const;
export const detectVoiceStatusIntent = (transcript: string): keyof typeof STATUS_PHRASES | undefined => {
  const text = normalize(transcript);
  return containsAny(text, STATUS_PHRASES.complete) ? "complete" : containsAny(text, STATUS_PHRASES.blocked) ? "blocked" : containsAny(text, STATUS_PHRASES.reopen) ? "reopen" : containsAny(text, STATUS_PHRASES.cancel) ? "cancel" : containsAny(text, STATUS_PHRASES.start) ? "start" : undefined;
};

const upcomingWeekday = (weekday: number) => {
  const date = new Date(); date.setHours(17, 0, 0, 0);
  let difference = (weekday - date.getDay() + 7) % 7; if (difference === 0) difference = 7;
  date.setDate(date.getDate() + difference); return date;
};

const parseDeadline = (transcript: string) => {
  const text = normalize(transcript); const date = new Date(); date.setHours(17, 0, 0, 0);
  if (text.includes("day after tomorrow") || text.includes("परसों")) date.setDate(date.getDate() + 2);
  else if (text.includes("tomorrow") || text.includes("kal") || text.includes("कल")) date.setDate(date.getDate() + 1);
  else if (text.includes("today") || text.includes("आज")) { /* keep today */ }
  else {
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const weekday = weekdays.findIndex((item) => text.includes(item));
    if (weekday >= 0) return upcomingWeekday(weekday).toISOString();
    const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (iso) { const parsed = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 17); if (!Number.isNaN(parsed.getTime())) return parsed.toISOString(); }
    else date.setDate(date.getDate() + 1);
  }
  return date.toISOString();
};

const extractTaskName = (transcript: string) => {
  let name = transcript.trim().replace(/[.!?]+$/, "");
  const markers = [/(?:my|the|a) task is to\s+/i, /task (?:of|to|called)\s+/i, /(?:create|add) (?:a )?(?:new )?task (?:to|for|called)?\s*/i];
  for (const marker of markers) { const match = name.match(marker); if (match?.index !== undefined) { name = name.slice(match.index + match[0].length); break; } }
  name = name
    .replace(/\s+(?:by|before|due(?: on)?|deadline(?: is)?)\s+(?:today|tomorrow|day after tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|20\d{2}-\d{1,2}-\d{1,2}).*$/i, "")
    .replace(/\s+(?:with\s+)?(?:low|medium|high|critical)\s+priority.*$/i, "")
    .replace(/\s+estimated\s+(?:at\s+)?\d+(?:\.\d+)?\s*hours?.*$/i, "")
    .replace(/^assign\s+[a-z][a-z\s'-]{1,80}?\s+(?:the\s+)?(?:task\s+)?(?:of|to)\s+/i, "")
    .trim();
  return name.slice(0, 200) || "Voice-created task";
};

const findMention = <T extends { label: string }>(transcript: string, options: T[]) => {
  const text = normalize(transcript);
  return options
    .filter((option) => text.includes(normalize(option.label)))
    .sort((a, b) => b.label.length - a.label.length)[0];
};

const detectPriority = (text: string): VoiceDraft["priority"] => text.includes("critical") || text.includes("urgent") ? "CRITICAL" : text.includes("high priority") ? "HIGH" : text.includes("low priority") ? "LOW" : "MEDIUM";
const detectComplexity = (text: string): VoiceDraft["complexity"] => text.includes("very hard") ? "VERY_HARD" : text.includes("hard") || text.includes("complex") ? "HARD" : text.includes("easy") || text.includes("simple") ? "EASY" : "MEDIUM";
const hourUnits = ["hour", "hours", "hr", "hrs", "घंटा", "घंटे", "तास", "மணி", "గంట", "గంటలు", "કલાક", "ಗಂಟೆ", "മണിക്കൂർ", "گھنٹہ", "گھنٹے"];
const numberWords: Array<[number, string[]]> = [[1, ["one", "एक", "এক", "ஒன்று", "ఒక", "एक", "એક", "ಒಂದು", "ഒന്ന്", "ਇੱਕ", "ایک"]], [2, ["two", "दो", "দুই", "இரண்டு", "రెండు", "दोन", "બે", "ಎರಡು", "രണ്ട്", "ਦੋ", "دو"]], [3, ["three", "तीन", "তিন", "மூன்று", "మూడు", "तीन", "ત્રણ", "ಮೂರು", "മൂന്ന്", "ਤਿੰਨ", "تین"]], [4, ["four", "चार", "চার", "நான்கு", "నాలుగు", "चार", "ચાર", "ನಾಲ್ಕು", "നാല്", "ਚਾਰ", "چار"]], [5, ["five", "पांच", "पाँच", "পাঁচ", "ஐந்து", "ఐదు", "पाच", "પાંચ", "ಐದು", "അഞ്ച്", "ਪੰਜ", "پانچ"]], [6, ["six", "छह", "ছয়", "ஆறு", "ఆరు", "सहा", "છ", "ಆರು", "ആറ്", "ਛੇ", "چھ"]], [7, ["seven", "सात", "সাত", "ஏழு", "ఏడు", "सात", "સાત", "ಏಳು", "ഏഴ്", "ਸੱਤ", "سات"]], [8, ["eight", "आठ", "আট", "எட்டு", "ఎనిమిది", "आठ", "આઠ", "ಎಂಟು", "എട്ട്", "ਅੱਠ", "آٹھ"]], [9, ["nine", "नौ", "নয়", "ஒன்பது", "తొమ్మిది", "नऊ", "નવ", "ಒಂಬತ್ತು", "ഒൻപത്", "ਨੌਂ", "نو"]], [10, ["ten", "दस", "দশ", "பத்து", "పది", "दहा", "દસ", "ಹತ್ತು", "പത്ത്", "ਦਸ", "دس"]]];
export const detectVoiceHours = (transcript: string) => { const text = normalize(transcript); if (!containsAny(text, hourUnits)) return 1; const numeric = text.match(/\b(\d+(?:\.\d+)?)\b/u); if (numeric) return Number(numeric[1]); return numberWords.find(([, variants]) => containsAny(text, variants))?.[0] ?? 1; };

type TranscriptionResult = { text: string; language?: string; languageProbability?: number; durationSeconds?: number };

const runTranscribeProcess = (pythonCommand: string, audioPath: string, requestedLanguage?: string) => new Promise<TranscriptionResult>((resolve, reject) => {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const script = path.resolve(dirname, "../../scripts/transcribe_audio.py");
  const args = [script, audioPath, "--model", env.VOICE_WHISPER_MODEL, "--device", env.VOICE_WHISPER_DEVICE, "--compute-type", env.VOICE_WHISPER_COMPUTE_TYPE];
  const language = requestedLanguage && requestedLanguage !== "auto" ? requestedLanguage.split("-").at(0)?.toLowerCase() : env.VOICE_WHISPER_LANGUAGE;
  if (language) args.push("--language", language);
  const child = spawn(pythonCommand, args, { windowsHide: true });
  let stdout = ""; let stderr = ""; let settled = false;
  const timeout = setTimeout(() => { child.kill(); if (!settled) { settled = true; reject(new AppError("Local voice transcription timed out", 504, "VOICE_TIMEOUT")); } }, env.VOICE_TRANSCRIPTION_TIMEOUT_MS);
  child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); if (stdout.length > 1_000_000) child.kill(); });
  child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
  child.on("error", (error) => { clearTimeout(timeout); if (!settled) { settled = true; reject(new AppError(`Could not start local Whisper: ${error.message}`, 503, "VOICE_ENGINE_UNAVAILABLE")); } });
  child.on("close", (code) => {
    clearTimeout(timeout); if (settled) return; settled = true;
    try {
      const lines = stdout.trim().split(/\r?\n/).filter(Boolean); const result = JSON.parse(lines.at(-1) ?? "{}") as { text?: string; error?: string; language?: string; languageProbability?: number; durationSeconds?: number };
      if (code !== 0 || result.error) return reject(new AppError(result.error ?? stderr.trim() ?? "Local transcription failed", 503, "VOICE_TRANSCRIPTION_FAILED"));
      if (!result.text?.trim()) return reject(new AppError("No speech was detected in the recording", 422, "NO_SPEECH_DETECTED"));
      resolve({ ...result, text: result.text.trim() });
    } catch { reject(new AppError(stderr.trim() || "Local transcription returned an invalid response", 503, "VOICE_TRANSCRIPTION_FAILED")); }
  });
});

const transcribeProcess = async (audioPath: string, requestedLanguage?: string): Promise<TranscriptionResult> => {
  const commands = [...new Set([env.VOICE_PYTHON_COMMAND, process.platform === "win32" ? "py" : "python3", "python3", "python"])];
  let lastError: unknown;
  for (const command of commands) {
    try { return await runTranscribeProcess(command, audioPath, requestedLanguage); }
    catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("ENOENT") && !message.includes("not installed")) throw error;
    }
  }
  throw lastError ?? new AppError("No Python voice runtime is available", 503, "VOICE_ENGINE_UNAVAILABLE");
};

export const transcribeAudio = async (file: Express.Multer.File, requestedLanguage?: string) => {
  const directory = await mkdtemp(path.join(tmpdir(), "mobius-voice-"));
  const audioPath = path.join(directory, `recording${audioExtensions[file.mimetype] ?? ".webm"}`);
  try { await writeFile(audioPath, file.buffer); return await transcribeProcess(audioPath, requestedLanguage); }
  finally { await rm(directory, { recursive: true, force: true }); }
};

const loadOptions = async (actor: Actor) => {
  const [projectsRaw, tasksRaw] = await Promise.all([listProjects(actor), listTasks({}, actor)]);
  const employeeFilter = actor.role === "EMPLOYEE" ? { user: actor.id, isActive: true } : { isActive: true };
  const employeesRaw = await Employee.find(employeeFilter).select("firstName lastName employeeId").sort({ firstName: 1 }).lean();
  const projects: Option[] = projectsRaw.map((item) => ({ id: item._id.toString(), label: item.name, detail: item.code }));
  const employees: Option[] = employeesRaw.map((item) => ({ id: item._id.toString(), label: `${item.firstName} ${item.lastName}`, detail: item.employeeId }));
  const tasks: Option[] = tasksRaw.map((item) => ({ id: item._id.toString(), label: item.name, detail: item.taskId, status: item.status }));
  return { projects, employees, tasks };
};

const buildDraft = (transcript: string, actor: Actor, options: Awaited<ReturnType<typeof loadOptions>>) => {
  const text = normalize(transcript);
  const statusIntent = detectVoiceStatusIntent(text);
  const exactTask = options.tasks.find((task) => task.detail && text.includes(normalize(task.detail)));
  const scoredTask = options.tasks.map((task) => ({ task, score: overlap(transcript, task.label) })).sort((a, b) => b.score - a.score)[0];
  const eligibleTasks = statusIntent === "complete" ? options.tasks.filter((item) => !["COMPLETED", "CANCELLED"].includes(item.status ?? "")) : options.tasks;
  const task = exactTask ?? (scoredTask && scoredTask.score >= 0.25 ? scoredTask.task : eligibleTasks.length === 1 ? eligibleTasks[0] : undefined);
  if (statusIntent) {
    let status: TaskDocument["status"] = statusIntent === "blocked" ? "BLOCKED" : statusIntent === "reopen" ? "REOPENED" : statusIntent === "cancel" ? "CANCELLED" : statusIntent === "start" ? "IN_PROGRESS" : "IN_REVIEW";
    if (statusIntent === "complete" && task?.status === "IN_REVIEW" && actor.role !== "EMPLOYEE") status = "COMPLETED";
    const draft: VoiceDraft = { action: "UPDATE_STATUS", task: task?.id, status, actualHours: detectVoiceHours(text), completionNote: transcript, blockerReason: "OTHER", blockerComment: status === "BLOCKED" ? transcript : undefined };
    return { draft, confidence: Math.min(0.98, 0.55 + (exactTask ? 0.35 : task ? 0.2 : 0)) };
  }
  const project = findMention(transcript, options.projects) ?? (options.projects.length === 1 ? options.projects[0] : undefined);
  const employee = actor.role === "EMPLOYEE" ? options.employees[0] : findMention(transcript, options.employees);
  const assignerMatch = transcript.match(/assigned by\s+(.+?)(?=\s+(?:by|before|due|with)\b|[.!?]|$)/i);
  const draft: VoiceDraft = {
    action: "CREATE_TASK", name: extractTaskName(transcript), description: transcript, project: project?.id,
    assignedEmployee: employee?.id, verbalAssigner: assignerMatch?.[1]?.trim() || (actor.role === "EMPLOYEE" ? "Voice self-report" : undefined),
    priority: detectPriority(text), complexity: detectComplexity(text), estimatedHours: detectVoiceHours(text), deadline: parseDeadline(transcript)
  };
  let confidence = 0.35; if (draft.name && draft.name !== "Voice-created task") confidence += 0.2; if (project) confidence += 0.2; if (employee) confidence += 0.15; if (/today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|20\d{2}-/.test(text)) confidence += 0.1;
  return { draft, confidence: Math.min(0.98, confidence) };
};

export const createPreview = async (transcript: string, actor: Actor, metadata: { language?: string; durationSeconds?: number } = {}) => {
  const cleanTranscript = transcript.trim(); if (cleanTranscript.length < 2) throw new AppError("Say or type a task command", 422, "EMPTY_TRANSCRIPT");
  const options = await loadOptions(actor); const { draft, confidence } = buildDraft(cleanTranscript, actor, options);
  const command = await VoiceCommand.create({ actor: actor.id, actorRole: actor.role, transcript: cleanTranscript, language: metadata.language, durationSeconds: metadata.durationSeconds, intent: draft.action, confidence, status: "TRANSCRIBED", draft });
  return { command: { id: command.id, transcript: command.transcript, language: command.language, durationSeconds: command.durationSeconds, confidence, status: command.status }, draft, options };
};

export const confirmCommand = async (id: string, draft: VoiceDraft, actor: Actor) => {
  const command = await VoiceCommand.findById(id); if (!command) throw new AppError("Voice command not found", 404);
  if (command.actor.toString() !== actor.id) throw new AppError("This voice command belongs to another user", 403);
  if (command.status !== "TRANSCRIBED") throw new AppError(`Voice command is already ${command.status.toLowerCase()}`, 409);
  let task: Awaited<ReturnType<typeof createTask>>;
  if (draft.action === "CREATE_TASK") {
    if (actor.role === "EMPLOYEE") task = await createManualTask({ name: draft.name!, description: draft.description, project: draft.project!, verbalAssigner: draft.verbalAssigner || "Voice self-report", priority: draft.priority ?? "MEDIUM", complexity: draft.complexity ?? "MEDIUM", estimatedHours: draft.estimatedHours ?? 1, deadline: new Date(draft.deadline!) }, actor);
    else {
      if (!actor.permissions.includes("task.create") || !actor.permissions.includes("task.assign")) throw new AppError("You cannot assign tasks", 403);
      if (!draft.assignedEmployee) throw new AppError("Choose the employee who should receive this task", 422);
      task = await createTask({ name: draft.name!, description: draft.description, project: draft.project!, assignedEmployee: draft.assignedEmployee, priority: draft.priority ?? "MEDIUM", complexity: draft.complexity ?? "MEDIUM", estimatedHours: draft.estimatedHours ?? 1, deadline: new Date(draft.deadline!) }, actor.id);
    }
  } else {
    const current = await Task.findById(draft.task!).select("status"); if (!current) throw new AppError("Task not found", 404);
    if (draft.status === "IN_REVIEW" && ["NOT_STARTED", "BLOCKED"].includes(current.status)) await transitionTask(draft.task!, { status: "IN_PROGRESS", actualHours: draft.actualHours }, actor);
    task = await transitionTask(draft.task!, { status: draft.status!, actualHours: draft.actualHours, completionNote: draft.completionNote, blockerReason: draft.status === "BLOCKED" ? (draft.blockerReason ?? "OTHER") : undefined, blockerComment: draft.blockerComment, blockerExternal: false }, actor);
  }
  command.intent = draft.action; command.draft = draft; command.task = task._id; command.status = "CONFIRMED"; await command.save();
  await writeAudit({ user: actor.id, action: "VOICE_TASK_COMMAND_CONFIRMED", entityType: "VoiceCommand", entityId: command.id, newValue: { intent: draft.action, transcript: command.transcript, task: task.id } });
  return { command, task };
};

export const cancelCommand = async (id: string, actor: Actor) => {
  const command = await VoiceCommand.findById(id); if (!command) throw new AppError("Voice command not found", 404);
  if (command.actor.toString() !== actor.id) throw new AppError("This voice command belongs to another user", 403);
  if (command.status !== "TRANSCRIBED") throw new AppError(`Voice command is already ${command.status.toLowerCase()}`, 409);
  command.status = "CANCELLED"; await command.save(); return command;
};

export const listHistory = async (actor: Actor) => {
  const filter = actor.role === "SUPER_ADMIN" ? {} : { actor: actor.id };
  return VoiceCommand.find(filter).populate("actor", "name email").populate("task", "taskId name status").sort({ createdAt: -1 }).limit(100).lean();
};
