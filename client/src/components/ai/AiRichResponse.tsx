import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCopy,
  Download,
  FileText,
  Lightbulb,
  ListChecks,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

type ReportBlock = { kind: "paragraph" | "bullet" | "number"; text: string; number?: string };
type ReportSection = { title: string; blocks: ReportBlock[] };
type ParsedReport = { title?: string; sections: ReportSection[] };

const removeMarkdown = (value: string) => value
  .replace(/^\*\*(.*)\*\*$/, "$1")
  .replace(/^__(.*)__$/, "$1")
  .trim();

const parseReport = (content: string): ParsedReport => {
  const lines = content.replace(/\r/g, "").split("\n");
  const sections: ReportSection[] = [];
  let reportTitle: string | undefined;
  let section: ReportSection = { title: "Summary", blocks: [] };
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) section.blocks.push({ kind: "paragraph", text });
    paragraph = [];
  };
  const flushSection = () => {
    flushParagraph();
    if (section.blocks.length) sections.push(section);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      const headingText = removeMarkdown(heading[2] ?? "");
      if (!reportTitle && sections.length === 0 && section.blocks.length === 0 && (heading[1]?.length ?? 0) <= 2) {
        reportTitle = headingText;
      } else {
        flushSection();
        section = { title: headingText, blocks: [] };
      }
      continue;
    }
    const bullet = /^[-+*\u2022]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      section.blocks.push({ kind: "bullet", text: bullet[1] ?? "" });
      continue;
    }
    const numbered = /^(\d+)[.)]\s+(.+)$/.exec(line);
    if (numbered) {
      flushParagraph();
      section.blocks.push({ kind: "number", number: numbered[1], text: numbered[2] ?? "" });
      continue;
    }
    if (!line) {
      flushParagraph();
      continue;
    }
    paragraph.push(line);
  }
  flushSection();
  if (!sections.length) sections.push({ title: "Summary", blocks: [{ kind: "paragraph", text: content }] });
  return { title: reportTitle, sections };
};

const InlineText = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\)|https?:\/\/[^\s)]+)/g).filter(Boolean);
  return <>{parts.map((part, index) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong className="font-semibold text-ink" key={index}>{bold[1]}</strong>;
    const code = /^`([^`]+)`$/.exec(part);
    if (code) return <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[.9em] text-brand-800" key={index}>{code[1]}</code>;
    const markdownLink = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(part);
    if (markdownLink) return <a className="font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-900" href={markdownLink[2]} key={index} target="_blank" rel="noreferrer">{markdownLink[1]}</a>;
    if (/^https?:\/\//.test(part)) return <a className="break-all font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-900" href={part} key={index} target="_blank" rel="noreferrer">{part}</a>;
    return <span key={index}>{part}</span>;
  })}</>;
};

const sectionVisual = (title: string): { Icon: LucideIcon; icon: string; panel: string } => {
  const value = title.toLowerCase();
  if (value.includes("strength") || value.includes("outcome") || value.includes("quality")) return { Icon: CheckCircle2, icon: "bg-emerald-50 text-emerald-700", panel: "border-emerald-100" };
  if (value.includes("gap") || value.includes("blocker") || value.includes("question") || value.includes("development")) return { Icon: AlertTriangle, icon: "bg-amber-50 text-amber-700", panel: "border-amber-100" };
  if (value.includes("goal") || value.includes("next-period")) return { Icon: Target, icon: "bg-blue-50 text-blue-700", panel: "border-blue-100" };
  if (value.includes("growth") || value.includes("progress")) return { Icon: TrendingUp, icon: "bg-violet-50 text-violet-700", panel: "border-violet-100" };
  if (value.includes("collaboration") || value.includes("support")) return { Icon: Users, icon: "bg-fuchsia-50 text-fuchsia-700", panel: "border-fuchsia-100" };
  if (value.includes("learning") || value.includes("skill")) return { Icon: BookOpen, icon: "bg-cyan-50 text-cyan-700", panel: "border-cyan-100" };
  if (value.includes("evidence") || value.includes("performance")) return { Icon: BarChart3, icon: "bg-brand-50 text-brand-700", panel: "border-brand-100" };
  if (value === "summary") return { Icon: Lightbulb, icon: "bg-brand-50 text-brand-700", panel: "border-brand-100" };
  return { Icon: ListChecks, icon: "bg-slate-100 text-slate-600", panel: "border-slate-200" };
};

const Block = ({ block }: { block: ReportBlock }) => {
  const advisory = /advisory draft|human reviewer/i.test(block.text);
  if (advisory) return <div className="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle className="mt-0.5 shrink-0" size={15}/><p><InlineText text={block.text}/></p></div>;
  if (block.kind === "bullet") return <li className="flex gap-2.5 text-sm leading-6 text-slate-700"><Check className="mt-1.5 shrink-0 text-brand-600" size={14}/><span><InlineText text={block.text}/></span></li>;
  if (block.kind === "number") return <li className="flex gap-2.5 text-sm leading-6 text-slate-700"><span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">{block.number}</span><span><InlineText text={block.text}/></span></li>;
  return <p className="text-sm leading-7 text-slate-700"><InlineText text={block.text}/></p>;
};

export const AiRichResponse = ({ content, compact = false, downloadName }: { content: string; compact?: boolean; downloadName?: string }) => {
  const report = useMemo(() => parseReport(content), [content]);
  const [openSections, setOpenSections] = useState<Set<number>>(() => new Set(report.sections.map((_, index) => index)));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOpenSections(new Set(report.sections.map((_, index) => index)));
    setCopied(false);
  }, [content, report.sections]);

  const toggleSection = (index: number) => setOpenSections((current) => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index); else next.add(index);
    return next;
  });
  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadName ?? "mobius-ai-report.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const allOpen = openSections.size === report.sections.length;

  return <div className={compact ? "space-y-2" : "overflow-hidden rounded-2xl border bg-slate-50/60"}>
    {(report.title || !compact) && <div className={`flex flex-col gap-3 border-b bg-gradient-to-r from-brand-50 via-white to-violet-50 ${compact ? "rounded-xl border p-3" : "p-4 sm:flex-row sm:items-center"}`}>
      {report.title && <div className="flex min-w-0 items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm"><FileText size={17}/></div><div className="min-w-0"><p className="break-words text-sm font-semibold text-ink">{report.title}</p><p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">Structured AI report <span aria-hidden="true">&middot;</span> {report.sections.length} sections</p></div></div>}
      <div className={`${report.title ? "sm:ml-auto" : "ml-auto"} flex items-center gap-1`}>
        {!compact && report.sections.length > 1 && <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 hover:bg-white hover:text-ink" onClick={() => setOpenSections(allOpen ? new Set() : new Set(report.sections.map((_, index) => index)))}><ChevronDown className={`transition ${allOpen ? "rotate-180" : ""}`} size={14}/>{allOpen ? "Collapse all" : "Expand all"}</button>}
        <button type="button" title="Copy response" aria-label="Copy AI response" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-brand-700" onClick={() => void copy()}>{copied ? <Check className="text-emerald-600" size={16}/> : <ClipboardCopy size={16}/>}</button>
        {!compact && downloadName && <button type="button" title="Download report" aria-label="Download AI report" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-brand-700" onClick={download}><Download size={16}/></button>}
      </div>
    </div>}
    <div className={compact ? "space-y-2" : "space-y-3 p-3 sm:p-4"}>{report.sections.map((item, index) => {
      const visual = sectionVisual(item.title); const open = openSections.has(index);
      const SectionIcon = visual.Icon;
      return <section className={`overflow-hidden rounded-xl border bg-white ${visual.panel}`} key={`${item.title}-${index}`}>
        <button type="button" className="flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50/70" aria-expanded={open} onClick={() => toggleSection(index)}><span className={`grid size-8 shrink-0 place-items-center rounded-lg ${visual.icon}`}><SectionIcon size={15}/></span><span className="min-w-0 flex-1 break-words text-sm font-semibold text-ink">{item.title}</span><span className="text-[10px] text-slate-400">{item.blocks.length} item{item.blocks.length === 1 ? "" : "s"}</span><ChevronDown className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} size={15}/></button>
        {open && <div className="space-y-3 border-t px-4 py-3"><div className="space-y-2">{item.blocks.map((block, blockIndex) => <Block block={block} key={blockIndex}/>)}</div></div>}
      </section>;
    })}</div>
  </div>;
};
