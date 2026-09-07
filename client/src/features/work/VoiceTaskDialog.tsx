import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileAudio, History, Mic, MicOff, Sparkles, Trash2, Users, X } from "lucide-react";
import type { RoleName } from "@mobiusbloom/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { workApi, type VoiceDraft, type VoicePreview } from "./workApi";

const statuses = ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "COMPLETED", "REOPENED", "CANCELLED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const complexities = ["EASY", "MEDIUM", "HARD", "VERY_HARD"];
const blockerReasons = ["WAITING_FOR_MANAGER", "WAITING_FOR_CLIENT", "TECHNICAL_ISSUE", "DEPENDENCY", "ACCESS_REQUIRED", "REQUIREMENT_UNCLEAR", "EXTERNAL_DEPENDENCY", "OTHER"];
const transitionTargets: Record<string, string[]> = { NOT_STARTED: ["IN_PROGRESS", "BLOCKED", "CANCELLED"], IN_PROGRESS: ["BLOCKED", "IN_REVIEW", "CANCELLED"], BLOCKED: ["IN_PROGRESS", "CANCELLED"], IN_REVIEW: ["COMPLETED", "REOPENED", "IN_PROGRESS"], COMPLETED: ["REOPENED"], REOPENED: ["IN_PROGRESS", "BLOCKED", "IN_REVIEW", "CANCELLED"], CANCELLED: [] };
const languages = [{ value: "auto", label: "Auto detect" }, { value: "en-IN", label: "English" }, { value: "hi-IN", label: "हिन्दी" }, { value: "bn-IN", label: "বাংলা" }, { value: "ta-IN", label: "தமிழ்" }, { value: "te-IN", label: "తెలుగు" }, { value: "mr-IN", label: "मराठी" }, { value: "gu-IN", label: "ગુજરાતી" }, { value: "kn-IN", label: "ಕನ್ನಡ" }, { value: "ml-IN", label: "മലയാളം" }, { value: "pa-IN", label: "ਪੰਜਾਬੀ" }, { value: "ur-IN", label: "اردو" }];

type BrowserSpeechResult = { 0?: { transcript: string } };
type BrowserSpeechEvent = { results: ArrayLike<BrowserSpeechResult> };
type BrowserSpeechRecognition = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; abort: () => void; onresult: ((event: BrowserSpeechEvent) => void) | null; onerror: (() => void) | null };
type BrowserSpeechConstructor = new () => BrowserSpeechRecognition;

const toLocalDateTimeValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export const VoiceTaskDialog = ({ role, onClose, onSuccess }: { role: RoleName; onClose: () => void; onSuccess: () => Promise<void> }) => {
  const queryClient = useQueryClient();
  const isEmployee = role === "EMPLOYEE";
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const speechRecognition = useRef<BrowserSpeechRecognition | null>(null);
  const browserTranscript = useRef("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [typed, setTyped] = useState("");
  const [language, setLanguage] = useState("auto");
  const [preview, setPreview] = useState<VoicePreview | null>(null);
  const [drafts, setDrafts] = useState<VoiceDraft[]>([]);
  const [localError, setLocalError] = useState("");
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const draft = drafts[0];

  const history = useQuery({ queryKey: ["voice-history"], queryFn: workApi.voiceHistory });
  const acceptPreview = (data: VoicePreview) => {
    setPreview(data);
    setDrafts(data.drafts?.length ? data.drafts : [data.draft]);
    setLocalError("");
    void queryClient.invalidateQueries({ queryKey: ["voice-history"] });
  };
  const previewMutation = useMutation({
    mutationFn: async (audio: Blob) => {
      try { return await workApi.voicePreview(audio, language); }
      catch (error) {
        const transcript = browserTranscript.current.trim();
        if (transcript.length < 2) throw error;
        const result = await workApi.voicePreviewText(transcript, language);
        setFallbackUsed(true);
        return result;
      }
    },
    onSuccess: acceptPreview,
  });
  const fileMutation = useMutation({ mutationFn: (file: File) => workApi.voicePreviewFile(file, language), onSuccess: acceptPreview });
  const textMutation = useMutation({ mutationFn: () => workApi.voicePreviewText(typed, language), onSuccess: acceptPreview });
  const confirm = useMutation({
    mutationFn: () => workApi.voiceConfirm(preview!.command.id, drafts.length > 1 ? { drafts } : drafts[0]),
    onSuccess: async () => {
      await onSuccess();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["voice-history"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
      onClose();
    },
  });
  const pending = previewMutation.isPending || fileMutation.isPending || textMutation.isPending;
  const error = localError || previewMutation.error?.message || fileMutation.error?.message || textMutation.error?.message || confirm.error?.message;

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);
  useEffect(() => () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    speechRecognition.current?.abort();
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Voice recording is not supported in this browser. Upload an audio file instead.");
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      chunks.current = [];
      browserTranscript.current = "";
      setSeconds(0);
      setFallbackUsed(false);
      const speechWindow = window as typeof window & { SpeechRecognition?: BrowserSpeechConstructor; webkitSpeechRecognition?: BrowserSpeechConstructor };
      const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
      if (SpeechRecognition) {
        speechRecognition.current = new SpeechRecognition();
        speechRecognition.current.continuous = true;
        speechRecognition.current.interimResults = true;
        speechRecognition.current.lang = language === "auto" ? navigator.language || "en-IN" : language;
        speechRecognition.current.onresult = (event) => {
          let transcript = "";
          for (let index = 0; index < event.results.length; index += 1) transcript += `${event.results[index][0]?.transcript ?? ""} `;
          browserTranscript.current = transcript.trim();
          setTyped(browserTranscript.current);
        };
        speechRecognition.current.onerror = () => { /* Recorded audio can still use server Whisper. */ };
        try { speechRecognition.current.start(); } catch { speechRecognition.current = null; }
      }
      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
      recorder.current = new MediaRecorder(stream.current, preferred ? { mimeType: preferred } : undefined);
      recorder.current.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      recorder.current.onstop = () => {
        const audio = new Blob(chunks.current, { type: recorder.current?.mimeType || "audio/webm" });
        stream.current?.getTracks().forEach((track) => track.stop());
        speechRecognition.current?.stop();
        setRecording(false);
        if (audio.size > 0) window.setTimeout(() => previewMutation.mutate(audio), 400);
      };
      recorder.current.start(250);
      setRecording(true);
      setLocalError("");
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "Microphone access failed");
    }
  };
  const stopRecording = () => { if (recorder.current?.state === "recording") recorder.current.stop(); };
  const close = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    speechRecognition.current?.abort();
    if (preview?.command.status === "TRANSCRIBED") void workApi.voiceCancel(preview.command.id);
    onClose();
  };
  const updateDraft = <K extends keyof VoiceDraft>(index: number, key: K, value: VoiceDraft[K]) => setDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const selectedTask = preview?.options.tasks.find((item) => item.id === draft?.task);
  const allowedStatuses = (taskStatus?: string) => {
    const direct = taskStatus ? transitionTargets[taskStatus] ?? [] : statuses;
    return [...new Set([...direct, ...(isEmployee && taskStatus && !["COMPLETED", "CANCELLED", "IN_REVIEW"].includes(taskStatus) ? ["IN_REVIEW"] : [])])];
  };
  const validStatuses = allowedStatuses(selectedTask?.status);

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"><div className="mx-auto my-4 w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
    <header className="flex items-start border-b p-6"><div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-700 text-white"><Mic size={20}/></div><div className="ml-3"><h2 className="text-xl font-semibold">Voice task assistant</h2><p className="mt-1 text-sm text-slate-500">{isEmployee ? "Create or update your tasks by speaking." : "Assign several people from one voice note."} Uses server Whisper with browser speech fallback.</p></div><button type="button" className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" onClick={close} aria-label="Close"><X size={18}/></button></header>

    {!preview && <section className="p-6"><label className="mb-4 block text-sm font-medium">Speaking language<select disabled={recording || pending} className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={language} onChange={(event) => setLanguage(event.target.value)}>{languages.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><div className={`grid place-items-center rounded-3xl border-2 border-dashed px-6 py-10 text-center ${recording ? "border-red-300 bg-red-50" : "border-violet-200 bg-violet-50/50"}`}><button type="button" disabled={pending} onClick={recording ? stopRecording : startRecording} className={`grid size-20 place-items-center rounded-full text-white shadow-lg transition hover:scale-105 ${recording ? "animate-pulse bg-red-500" : "bg-brand-600"}`}>{recording ? <MicOff size={30}/> : <Mic size={30}/>}</button><h3 className="mt-4 font-semibold">{recording ? `Listening… ${seconds}s` : pending ? "Understanding the assignments…" : "Tap to speak"}</h3><p className="mt-2 max-w-2xl text-sm text-slate-500">Try: “Vandana ko payroll report banana hai aur Ayush ko client follow-up karna hai by tomorrow.”</p>{recording && <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={stopRecording}><MicOff size={16}/> Stop and transcribe</Button>}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"><FileAudio size={17}/> Upload recording<input className="sr-only" type="file" accept="audio/webm,audio/ogg,audio/wav,audio/mpeg,audio/mp4,.m4a" onChange={(event) => { const file = event.target.files?.[0]; if (file) fileMutation.mutate(file); }}/></label><div className="flex gap-2"><Input placeholder="Or type the command to test" value={typed} onChange={(event) => setTyped(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && typed.trim().length >= 2) textMutation.mutate(); }}/><Button variant="secondary" disabled={typed.trim().length < 2 || pending} onClick={() => textMutation.mutate()}><Sparkles size={16}/> Interpret</Button></div></div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>}

    {preview && draft && <form className="p-6" onSubmit={(event) => { event.preventDefault(); confirm.mutate(); }}>
      {fallbackUsed && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Server Whisper was unavailable, so this transcript used your browser&apos;s built-in speech recognition.</p>}
      <div className="rounded-2xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Transcript</span><div className="flex items-center gap-2">{drafts.length > 1 && <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700"><Users size={13}/>{drafts.length} assignments found</span>}<span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">{Math.round(preview.command.confidence * 100)}% confidence{preview.command.language ? ` · ${preview.command.language}` : ""}</span></div></div><p className="mt-2 text-sm leading-6 text-slate-700">“{preview.command.transcript}”</p></div>

      {drafts.length > 1 ? <div className="mt-5 space-y-4">{drafts.map((item, index) => <section className="rounded-2xl border p-5" key={`${item.assignedEmployee}-${index}`}><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Assignment {index + 1}</p><p className="mt-1 text-sm text-slate-500">Review the extracted employee and task before creating it.</p></div><button type="button" onClick={() => setDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove assignment ${index + 1}`}><Trash2 size={16}/></button></div><div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Task name<Input required minLength={2} className="mt-2" value={item.name ?? ""} onChange={(event) => updateDraft(index, "name", event.target.value)}/></label>
        <label className="text-sm font-medium">Assign to<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={item.assignedEmployee ?? ""} onChange={(event) => updateDraft(index, "assignedEmployee", event.target.value)}><option value="">Select employee</option>{preview.options.employees.map((option) => <option value={option.id} key={option.id}>{option.label}{option.detail ? ` (${option.detail})` : ""}</option>)}</select></label>
        <label className="text-sm font-medium">Project<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={item.project ?? ""} onChange={(event) => updateDraft(index, "project", event.target.value)}><option value="">Select project</option>{preview.options.projects.map((option) => <option value={option.id} key={option.id}>{option.label}{option.detail ? ` (${option.detail})` : ""}</option>)}</select></label>
        <label className="text-sm font-medium">Deadline<Input required type="datetime-local" className="mt-2" value={toLocalDateTimeValue(item.deadline)} onChange={(event) => updateDraft(index, "deadline", event.target.value ? new Date(event.target.value).toISOString() : "")}/></label>
        <label className="text-sm font-medium">Estimated hours<Input required type="number" min=".25" step=".25" className="mt-2" value={item.estimatedHours ?? 1} onChange={(event) => updateDraft(index, "estimatedHours", Number(event.target.value))}/></label>
        <label className="text-sm font-medium">Priority<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={item.priority ?? "MEDIUM"} onChange={(event) => updateDraft(index, "priority", event.target.value)}>{priorities.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="text-sm font-medium">Complexity<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={item.complexity ?? "MEDIUM"} onChange={(event) => updateDraft(index, "complexity", event.target.value)}>{complexities.map((option) => <option key={option}>{option.replaceAll("_", " ")}</option>)}</select></label>
        <label className="text-sm font-medium sm:col-span-2">Description<textarea rows={2} className="mt-2 w-full resize-none rounded-xl border px-3 py-2 text-sm" value={item.description ?? ""} onChange={(event) => updateDraft(index, "description", event.target.value)}/></label>
      </div></section>)}</div> : <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Action<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={draft.action} onChange={(event) => { const action = event.target.value as VoiceDraft["action"]; setDrafts([action === "UPDATE_STATUS" ? { action, task: preview.options.tasks[0]?.id, status: "IN_REVIEW", completionNote: preview.command.transcript } : { action, name: preview.command.transcript.slice(0, 200), description: preview.command.transcript, project: preview.options.projects[0]?.id, assignedEmployee: isEmployee ? preview.options.employees[0]?.id : undefined, verbalAssigner: isEmployee ? "Manager (voice-reported)" : undefined, priority: "MEDIUM", complexity: "MEDIUM", estimatedHours: 1, deadline: new Date(Date.now() + 86_400_000).toISOString() }]); }}><option value="CREATE_TASK">Create a task</option><option value="UPDATE_STATUS">Update or complete a task</option></select></label>
        {draft.action === "CREATE_TASK" ? <>
          <label className="text-sm font-medium sm:col-span-2">Task name<Input required minLength={2} className="mt-2" value={draft.name ?? ""} onChange={(event) => updateDraft(0, "name", event.target.value)}/></label>
          <label className="text-sm font-medium">Project<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={draft.project ?? ""} onChange={(event) => updateDraft(0, "project", event.target.value)}><option value="">Select project</option>{preview.options.projects.map((item) => <option value={item.id} key={item.id}>{item.label}{item.detail ? ` (${item.detail})` : ""}</option>)}</select></label>
          {isEmployee ? <label className="text-sm font-medium">Assigned verbally by<Input required className="mt-2" placeholder="Manager or lead name" value={draft.verbalAssigner ?? ""} onChange={(event) => updateDraft(0, "verbalAssigner", event.target.value)}/></label> : <label className="text-sm font-medium">Assign to<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={draft.assignedEmployee ?? ""} onChange={(event) => updateDraft(0, "assignedEmployee", event.target.value)}><option value="">Select employee</option>{preview.options.employees.map((item) => <option value={item.id} key={item.id}>{item.label}{item.detail ? ` (${item.detail})` : ""}</option>)}</select></label>}
          <label className="text-sm font-medium">Deadline date and time<Input required type="datetime-local" className="mt-2" value={toLocalDateTimeValue(draft.deadline)} onChange={(event) => updateDraft(0, "deadline", event.target.value ? new Date(event.target.value).toISOString() : "")}/></label>
          <label className="text-sm font-medium">Estimated hours<Input required type="number" min=".25" step=".25" className="mt-2" value={draft.estimatedHours ?? 1} onChange={(event) => updateDraft(0, "estimatedHours", Number(event.target.value))}/></label>
          <label className="text-sm font-medium">Priority<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={draft.priority ?? "MEDIUM"} onChange={(event) => updateDraft(0, "priority", event.target.value)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-medium">Complexity<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={draft.complexity ?? "MEDIUM"} onChange={(event) => updateDraft(0, "complexity", event.target.value)}>{complexities.map((item) => <option key={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
          <label className="text-sm font-medium sm:col-span-2">Description<textarea rows={3} className="mt-2 w-full resize-none rounded-xl border px-3 py-2 text-sm" value={draft.description ?? ""} onChange={(event) => updateDraft(0, "description", event.target.value)}/></label>
        </> : <>
          <label className="text-sm font-medium">Task<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={draft.task ?? ""} onChange={(event) => { const task = preview.options.tasks.find((item) => item.id === event.target.value); const allowed = allowedStatuses(task?.status); setDrafts([{ ...draft, task: event.target.value, status: draft.status && allowed.includes(draft.status) ? draft.status : allowed[0] }]); }}><option value="">Select task</option>{preview.options.tasks.map((item) => <option value={item.id} key={item.id}>{item.detail} · {item.label} ({item.status?.replaceAll("_", " ")})</option>)}</select></label>
          <label className="text-sm font-medium">New status<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={draft.status ?? ""} onChange={(event) => updateDraft(0, "status", event.target.value)}><option value="">Select status</option>{validStatuses.map((item) => <option value={item} key={item}>{item === "IN_REVIEW" && isEmployee ? "COMPLETED — SEND FOR REVIEW" : item.replaceAll("_", " ")}</option>)}</select></label>
          {draft.status === "BLOCKED" && <><label className="text-sm font-medium">Blocker reason<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={draft.blockerReason ?? "OTHER"} onChange={(event) => updateDraft(0, "blockerReason", event.target.value)}>{blockerReasons.map((item) => <option key={item}>{item.replaceAll("_", " ")}</option>)}</select></label><label className="text-sm font-medium">Blocker note<Input className="mt-2" value={draft.blockerComment ?? ""} onChange={(event) => updateDraft(0, "blockerComment", event.target.value)}/></label></>}
          <label className="text-sm font-medium">Actual hours<Input type="number" min="0" step=".01" placeholder="Auto from tracked time" className="mt-2" value={draft.actualHours ?? ""} onChange={(event) => updateDraft(0, "actualHours", event.target.value === "" ? undefined : Number(event.target.value))}/></label>
          <label className="text-sm font-medium sm:col-span-2">Completion / update note<textarea required={draft.status === "IN_REVIEW"} minLength={draft.status === "IN_REVIEW" ? 10 : undefined} rows={3} className="mt-2 w-full resize-none rounded-xl border px-3 py-2 text-sm" value={draft.completionNote ?? ""} onChange={(event) => updateDraft(0, "completionNote", event.target.value)}/></label>
        </>}
      </div>}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" onClick={() => { void workApi.voiceCancel(preview.command.id); setPreview(null); setDrafts([]); }}>Discard</Button><Button disabled={confirm.isPending || drafts.length === 0}><Check size={16}/>{confirm.isPending ? "Applying…" : drafts.length > 1 ? `Confirm and create ${drafts.length} tasks` : draft.action === "CREATE_TASK" ? "Confirm and create" : "Confirm update"}</Button></div>
    </form>}

    <section className="border-t px-6 py-5"><div className="flex items-center gap-2"><History size={16} className="text-slate-400"/><h3 className="text-sm font-semibold">{role === "SUPER_ADMIN" ? "Organization voice history" : "Your recent voice commands"}</h3></div><div className="mt-3 max-h-44 space-y-2 overflow-y-auto">{history.data?.items.slice(0, 8).map((item) => <div className="flex items-start gap-3 rounded-xl border p-3" key={item._id}><span className={`mt-1 size-2 shrink-0 rounded-full ${item.status === "CONFIRMED" ? "bg-emerald-500" : item.status === "CANCELLED" ? "bg-slate-300" : "bg-amber-400"}`}/><div className="min-w-0 flex-1"><p className="truncate text-xs text-slate-600">{item.transcript}</p><p className="mt-1 text-[10px] text-slate-400">{role === "SUPER_ADMIN" ? `${item.actor.name} · ` : ""}{item.intent.replaceAll("_", " ")} · {item.status} · {new Date(item.createdAt).toLocaleString()}</p></div>{(item.tasks?.length ?? 0) > 1 ? <span className="shrink-0 text-[10px] font-semibold text-brand-700">{item.tasks!.length} tasks</span> : item.task && <span className="shrink-0 text-[10px] font-semibold text-brand-700">{item.task.taskId}</span>}</div>)}{history.data?.items.length === 0 && <p className="py-3 text-sm text-slate-400">No voice commands yet.</p>}</div></section>
  </div></div>;
};
