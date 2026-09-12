import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, Flame, Sparkles, Trophy, Zap, X } from "lucide-react";
import { workApi } from "./workApi";

const badgeAccent = (level: number) => level >= 7 ? "from-cyan-300 via-blue-400 to-violet-500" : level >= 6 ? "from-sky-200 to-cyan-400" : level >= 5 ? "from-violet-300 to-fuchsia-500" : level >= 4 ? "from-amber-300 to-yellow-500" : level >= 2 ? "from-slate-200 to-slate-400" : "from-orange-300 to-amber-600";

export const GamificationHeader = () => {
  const { data, isLoading } = useQuery({ queryKey: ["gamification"], queryFn: workApi.gamification });
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!data) return;
    const key = "mobius-gamification-level";
    const seen = Number(localStorage.getItem(key) ?? data.currentLevel);
    if (data.currentLevel > seen) setCelebrate(true);
    localStorage.setItem(key, String(data.currentLevel));
  }, [data]);
  if (isLoading) return <div className="h-56 animate-pulse rounded-3xl bg-slate-900" aria-label="Loading progression"/>;
  if (!data) return null;
  const stats = [
    { Icon: Flame, label: `${data.streakDays} Day${data.streakDays === 1 ? "" : "s"} Streak`, color: "text-orange-300" },
    { Icon: Zap, label: `${data.totalLifetimeXp.toLocaleString()} Total XP`, color: "text-cyan-300" },
    { Icon: CheckCircle2, label: `${data.completedTasksCount} Tasks Completed`, color: "text-emerald-300" },
    { Icon: Trophy, label: data.recentAchievement?.name ?? "First badge awaits", color: "text-amber-300" }
  ];
  return <>
    <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-5 text-white shadow-2xl shadow-violet-950/20 sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-violet-500/20 blur-3xl"/><div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-cyan-400/10 blur-3xl"/>
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-4 lg:w-[320px]">
          <div className={`grid size-24 shrink-0 place-items-center bg-gradient-to-br ${badgeAccent(data.currentLevel)} p-[2px] shadow-lg shadow-violet-500/30 [clip-path:polygon(25%_5%,75%_5%,100%_28%,88%_78%,50%_100%,12%_78%,0_28%)]`}>
            <div className="grid size-[90px] place-items-center bg-slate-950 [clip-path:inherit]"><div className="text-center"><Award className="mx-auto text-white/70" size={18}/><p className="mt-1 text-[10px] font-bold tracking-[.2em] text-white/60">LVL</p><p className="text-2xl font-black leading-none">{String(data.currentLevel).padStart(2, "0")}</p></div></div>
          </div>
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">Current rank</p><h2 className="mt-1 text-xl font-bold sm:text-2xl">{data.tierName}</h2><p className="mt-1 text-sm text-white/55">{data.xpToNextLevel.toLocaleString()} XP to Level {data.currentLevel + 1}</p></div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">Experience progress</p><p className="mt-1 text-lg font-bold">{data.currentLevelXp.toLocaleString()} <span className="text-white/35">/ {data.xpForNextLevel.toLocaleString()} XP</span></p></div><p className="text-2xl font-black text-white/90">{data.progressPercent}%</p></div>
          <div className="mt-3 h-4 overflow-hidden rounded-full border border-white/10 bg-black/35 p-0.5"><div className="relative h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-300 transition-[width] duration-1000 ease-out" style={{ width: `${data.progressPercent}%` }}><span className="absolute right-0 top-1/2 size-4 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_18px_5px_rgba(103,232,249,.75)]"/></div></div>
          <div className="mt-5 flex flex-wrap gap-2">{stats.map(({ Icon, label, color }) => <div key={label} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-2 text-xs font-semibold backdrop-blur"><Icon size={15} className={color}/><span>{label}</span></div>)}</div>
        </div>
      </div>
    </section>
    {celebrate && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Level up"><div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-300/30 bg-gradient-to-br from-indigo-950 to-violet-950 p-8 text-center text-white shadow-2xl"><button className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:bg-white/10" onClick={() => setCelebrate(false)} aria-label="Close celebration"><X size={18}/></button><Sparkles className="mx-auto animate-pulse text-amber-300" size={42}/><p className="mt-4 text-xs font-bold uppercase tracking-[.3em] text-violet-300">Level up</p><div className={`mx-auto mt-5 grid size-28 place-items-center bg-gradient-to-br ${badgeAccent(data.currentLevel)} text-4xl font-black text-slate-950 [clip-path:polygon(25%_5%,75%_5%,100%_28%,88%_78%,50%_100%,12%_78%,0_28%)]`}>{data.currentLevel}</div><h2 className="mt-5 text-3xl font-black">{data.tierName}</h2><p className="mt-2 text-sm text-white/60">New rank unlocked. Keep the momentum going.</p></div></div>}
  </>;
};
