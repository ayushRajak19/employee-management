import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Check, Circle, ListTodo, MessageCircleMore, RefreshCw, Send, Smile, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AiRichResponse } from "@/components/ai/AiRichResponse";
import { aiApi } from "./aiApi";
import { todoApi } from "@/features/todos/todoApi";

export const AskMobiusFloating = () => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ask = useMutation({ mutationFn: aiApi.ask });
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return <>
    {open && <button type="button" aria-label="Close Ask Mobius" className="fixed inset-0 z-[55] bg-ink/20 backdrop-blur-[1px] sm:hidden" onClick={() => setOpen(false)}/>}
    {open && <section role="dialog" aria-modal="true" aria-labelledby="ask-mobius-title" className="fixed inset-x-3 bottom-24 z-[60] flex max-h-[min(620px,calc(100vh-7rem))] flex-col overflow-hidden rounded-3xl border bg-white shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[390px]">
      <div className="flex items-center border-b bg-gradient-to-r from-violet-50 to-white p-4"><div className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white"><Bot size={19}/></div><div className="ml-3 min-w-0"><h2 id="ask-mobius-title" className="font-semibold">Ask Mobius</h2><p className="truncate text-xs text-slate-400">Your permission-aware AI assistant</p></div><button type="button" aria-label="Close Ask Mobius" className="ml-auto grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-white" onClick={() => setOpen(false)}><X size={18}/></button></div>
      <div className="min-h-52 flex-1 overflow-y-auto p-4"><div className="rounded-2xl bg-brand-50 p-3 text-sm leading-6 text-brand-900">Hi! Ask me about tasks, goals, performance evidence or how to use the portal.</div>{ask.isPending && <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-500"><RefreshCw className="animate-spin" size={15}/> Thinking…</div>}{ask.data && <div className="mt-3"><AiRichResponse content={ask.data.answer} compact/></div>}{ask.error && <p role="alert" className="mt-3 rounded-2xl bg-red-50 p-3 text-sm leading-5 text-red-700">{ask.error.message}</p>}</div>
      <form className="flex min-w-0 gap-2 border-t bg-white p-3" onSubmit={(event) => { event.preventDefault(); const value = question.trim(); if (!value) return; ask.mutate(value); setQuestion(""); }}><Input ref={inputRef} aria-label="Question for Ask Mobius" maxLength={500} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Type your question…"/><Button className="size-11 shrink-0 px-0" aria-label="Send question" disabled={!question.trim() || ask.isPending}><Send size={16}/></Button></form>
    </section>}
    <button type="button" title="Ask Mobius" aria-label={open ? "Close Ask Mobius" : "Open Ask Mobius"} aria-expanded={open} className="fixed bottom-5 right-4 z-[65] grid size-12 place-items-center rounded-full bg-brand-600 p-0 text-white shadow-xl shadow-brand-300/50 transition hover:-translate-y-0.5 hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200 sm:bottom-6 sm:right-6" onClick={() => setOpen((value) => !value)}>{open ? <X size={20}/> : <Bot size={20}/>}</button>
  </>;
};

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export const DailyTodoPanel = () => {
  const date = today(); const qc = useQueryClient(); const [title, setTitle] = useState("");
  const query = useQuery({ queryKey: ["todos", date], queryFn: () => todoApi.list(date) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["todos", date] });
  const create = useMutation({ mutationFn: () => todoApi.create({ date, title: title.trim() }), onSuccess: async () => { setTitle(""); await refresh(); } });
  const update = useMutation({ mutationFn: ({ id, completed }: { id: string; completed: boolean }) => todoApi.update(id, { completed }), onSuccess: refresh });
  const remove = useMutation({ mutationFn: todoApi.remove, onSuccess: refresh });
  const items = query.data?.items ?? []; const done = items.filter((item) => item.completed).length;
  return <section className="min-w-0 overflow-hidden rounded-2xl border bg-white p-4 shadow-soft sm:p-5"><div className="flex items-center"><div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ListTodo size={18}/></div><div className="ml-3"><h2 className="font-semibold">Today&apos;s to-do list</h2><p className="text-xs text-slate-400">Private to you · not used for performance · {done}/{items.length} completed</p></div></div><form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (title.trim()) create.mutate(); }}><Input maxLength={240} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add today’s task"/><Button disabled={!title.trim() || create.isPending}>Add</Button></form><div className="mt-4 space-y-2">{items.map((item) => <div key={item._id} className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 p-3"><button type="button" aria-label={item.completed ? "Mark incomplete" : "Mark complete"} className={item.completed ? "text-emerald-600" : "text-slate-400"} onClick={() => update.mutate({ id: item._id, completed: !item.completed })}>{item.completed ? <Check size={19}/> : <Circle size={19}/>}</button><p className={`min-w-0 flex-1 break-words text-sm ${item.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.title}</p><button type="button" aria-label="Delete to-do" className="grid size-8 place-items-center rounded-lg text-red-500 hover:bg-red-50" onClick={() => remove.mutate(item._id)}><Trash2 size={14}/></button></div>)}{!query.isLoading && items.length === 0 && <p className="py-5 text-center text-sm text-slate-400">Add your first task for today.</p>}</div>{(create.error || update.error || remove.error) && <p role="alert" className="mt-3 text-xs text-red-600">{(create.error || update.error || remove.error)?.message}</p>}</section>;
};

export const MoodBreakPanel = () => {
  const [index, setIndex] = useState(0); const query = useQuery({ queryKey: ["ai-joke", index], queryFn: () => aiApi.joke(index), staleTime: 60 * 60 * 1000 });
  return <section className="min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-5 text-white shadow-soft"><div className="flex items-center"><Smile size={20}/><div className="ml-2"><h2 className="font-semibold">Mood Break</h2><p className="text-xs text-white/70">Safe Hinglish office humour</p></div></div><div className="mt-5 flex min-h-24 items-center rounded-2xl bg-white/10 p-4"><MessageCircleMore className="mr-3 shrink-0 text-white/70" size={20}/><p className="text-sm font-medium leading-6">{query.isLoading ? "Joke aa raha hai… chai ready rakho!" : query.data?.joke ?? "Aaj joke bhi meeting mein busy hai 😄"}</p></div><button type="button" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/25" onClick={() => setIndex((value) => (value + 1) % 3)}><RefreshCw size={13}/> Another joke</button></section>;
};
