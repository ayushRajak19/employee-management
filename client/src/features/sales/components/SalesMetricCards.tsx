import type { SalesAnalytics } from "@mobius-ems/shared";
import { Activity, BadgeIndianRupee, BriefcaseBusiness, Clock3, Target, TrendingUp, UserRoundCheck, Users } from "lucide-react";

const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

const safeCurrency = (currency?: string): string => {
  if (!currency || typeof currency !== "string") return "INR";
  const cleaned = currency.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(cleaned) ? cleaned : "INR";
};

const safeMoney = (value: number | undefined | null, currency?: string): string => {
  const amount = typeof value === "number" && !isNaN(value) ? value : 0;
  const curr = safeCurrency(currency);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${curr} ${amount.toLocaleString("en-IN")}`;
  }
};

const safeNumber = (value: number | undefined | null, suffix = ""): string => {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  try {
    return `${numberFormatter.format(num)}${suffix}`;
  } catch {
    return `${num}${suffix}`;
  }
};

export const SalesMetricCards = ({ data }: { data?: Partial<SalesAnalytics> | null }) => {
  const safeData = data ?? {};
  const currency = safeData.currency;
  const actualRevenue = safeData.actualRevenue ?? 0;
  const targetRevenue = safeData.targetRevenue ?? 0;
  const targetAchievement = safeData.targetAchievement ?? 0;
  const leadCount = safeData.leadCount ?? 0;
  const conversionRate = safeData.conversionRate ?? 0;
  const customerCount = safeData.customerCount ?? 0;
  const avgFirstResponseMinutes = safeData.avgFirstResponseMinutes ?? 0;

  const metrics = [
    ["Revenue", safeMoney(actualRevenue, currency), BadgeIndianRupee],
    ["Target achievement", safeNumber(targetAchievement, "%"), Target],
    ["Sales target", safeMoney(targetRevenue, currency), TrendingUp],
    ["Remaining quota", safeMoney(Math.max(0, targetRevenue - actualRevenue), currency), BriefcaseBusiness],
    ["Leads", safeNumber(leadCount), Users],
    ["Conversion", safeNumber(conversionRate, "%"), Activity],
    ["Customers", safeNumber(customerCount), UserRoundCheck],
    ["Response time", safeNumber(avgFirstResponseMinutes, " min"), Clock3],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label, value, Icon]) => (
        <article key={label} className="rounded-2xl border bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <Icon size={16} className="text-brand-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
        </article>
      ))}
    </div>
  );
};

