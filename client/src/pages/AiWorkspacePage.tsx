import { useQuery } from "@tanstack/react-query";
import { Bot, CheckCircle2, Settings2, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { DailyTodoPanel, MoodBreakPanel } from "@/features/ai/AiWorkspacePanels";
import { aiApi } from "@/features/ai/aiApi";
import { useAuth } from "@/features/auth/AuthProvider";

export const AiWorkspacePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const configuration = useQuery({ queryKey: ["ai", "configuration"], queryFn: aiApi.configuration });
  const employeeView = user?.role === "EMPLOYEE";
  const ready = configuration.data?.configured === true;

  return <main className="flex-1 px-4 py-6 sm:px-8 sm:py-9"><div className="mx-auto w-full max-w-[1440px]">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-brand-700"><Sparkles size={17}/><p className="text-sm font-medium">Mobius AI</p></div><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">AI Workspace</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Ask permission-aware questions and turn recorded evidence into useful summaries without allowing AI to make employment decisions.</p></div><div className={`inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${ready ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{ready ? <CheckCircle2 size={15}/> : <Settings2 size={15}/>} {configuration.isLoading ? "Checking AI setup…" : ready ? `${configuration.data?.provider} · ${configuration.data?.model}` : "AI setup required"}</div></div>

    {!configuration.isLoading && !ready && <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:p-5"><h2 className="font-semibold">Connect Groq to activate AI responses</h2><p className="mt-1 text-sm leading-6 text-amber-800">The AI screens are installed, but Hostinger does not currently report an active AI key. Add AI_PROVIDER, GROQ_API_KEY and AI_MODEL in Hostinger environment variables, then redeploy. Keep the API key private.</p></section>}

    <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-2"><section className="min-w-0 rounded-2xl border bg-white p-5 shadow-soft"><div className="flex items-center"><div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Bot size={18}/></div><div className="ml-3"><h2 className="font-semibold">Ask Mobius anywhere</h2><p className="text-xs text-slate-400">Use the floating button in the lower-right corner.</p></div></div><p className="mt-5 text-sm leading-6 text-slate-600">The assistant stays available while you move between dashboard, employee, task and performance pages.</p></section>{employeeView ? <DailyTodoPanel/> : <section className="min-w-0 rounded-2xl border bg-white p-5 shadow-soft"><div className="flex items-center"><div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Users size={18}/></div><div className="ml-3"><h2 className="font-semibold">Employee AI summaries</h2><p className="text-xs text-slate-400">Contribution and performance drafts for each employee.</p></div></div><p className="mt-5 text-sm leading-6 text-slate-600">Open an employee profile and select <strong>AI summaries</strong>. The summaries use recorded tasks, outcomes, support and performance evidence.</p><Button className="mt-4" onClick={() => navigate("/employees")}><Bot size={15}/> Choose an employee</Button></section>}</div>
    {employeeView && <div className="mt-5 max-w-2xl"><MoodBreakPanel/></div>}
  </div></main>;
};
