import type { SalesAnalytics } from "@mobius-ems/shared";
import { Activity, BadgeIndianRupee, BriefcaseBusiness, Clock3, Target, TrendingUp, UserRoundCheck, Users } from "lucide-react";

const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
const money = (value: number, currency: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

export const SalesMetricCards = ({ data }: { data: SalesAnalytics }) => {
  const metrics = [
    ["Revenue", money(data.actualRevenue, data.currency), BadgeIndianRupee],
    ["Target achievement", `${number.format(data.targetAchievement)}%`, Target],
    ["Sales target", money(data.targetRevenue, data.currency), TrendingUp],
    ["Remaining quota", money(Math.max(0, data.targetRevenue - data.actualRevenue), data.currency), BriefcaseBusiness],
    ["Leads", number.format(data.leadCount), Users],
    ["Conversion", `${number.format(data.conversionRate)}%`, Activity],
    ["Customers", number.format(data.customerCount), UserRoundCheck],
    ["Response time", `${number.format(data.avgFirstResponseMinutes)} min`, Clock3],
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, Icon]) => <article key={label} className="rounded-2xl border bg-white p-4 shadow-soft"><div className="flex items-center justify-between"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><Icon size={16} className="text-brand-600"/></div><p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p></article>)}</div>;
};
