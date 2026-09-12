import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { GeographicRollupNode } from "@mobius-ems/shared";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Flame,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface GeoIntelligencePanelProps {
  node: GeographicRollupNode | null;
  ancestors?: Array<{ _id: string; name: string; code: string; type: string }>;
  onClose: () => void;
  onDrillDown?: (id: string) => void;
  canDrillDown?: boolean;
}

export const GeoIntelligencePanel = ({
  node,
  ancestors = [],
  onClose,
  onDrillDown,
  canDrillDown = true,
}: GeoIntelligencePanelProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!node) return null;

  const pacing = node.assignedTarget > 0
    ? Math.min(200, Math.round((node.actualRevenue / node.assignedTarget) * 100))
    : node.actualRevenue > 0 ? 100 : 0;

  const isBottleneck = node.isCapacityBottleneck || node.headcountGap > 0;
  const isHealthy = !isBottleneck && node.capacityUtilization <= 80;
  const isApproaching = !isBottleneck && node.capacityUtilization > 80;

  // Format currency
  const formatCurrency = (amt: number) => {
    return "₹" + Math.round(amt).toLocaleString("en-IN");
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[1200] flex w-full max-w-lg flex-col bg-white shadow-2xl transition-all duration-300 animate-in slide-in-from-right sm:border-l sm:border-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/80 p-5 backdrop-blur-sm">
        <div className="space-y-1">
          {ancestors.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
              {ancestors.map((anc, idx) => (
                <span key={anc._id} className="flex items-center gap-1">
                  <span>{anc.name}</span>
                  {idx < ancestors.length - 1 && <ChevronRight size={12} className="text-slate-400" />}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{node.name}</h2>
            <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
              {node.type}
            </span>
          </div>
          {node.managerName && (
            <p className="flex items-center gap-1.5 text-xs text-slate-600">
              <UserCheck size={13} className="text-slate-400" />
              <span>Manager: <strong className="font-medium text-slate-800">{node.managerName}</strong></span>
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          aria-label="Close intelligence drawer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Status Badge Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {isBottleneck && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200/60">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
              Critical Capacity Bottleneck ({node.headcountGap} Rep Deficit)
            </span>
          )}
          {isApproaching && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200/60">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Approaching Capacity ({node.capacityUtilization}%)
            </span>
          )}
          {isHealthy && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Healthy Capacity Bandwidth
            </span>
          )}
          {node.whiteSpaceRecommendation.includes("APPOINT_CHANNEL_PARTNER") && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
              <Flame size={13} className="text-indigo-600" />
              High Opportunity White-Space Zone
            </span>
          )}
        </div>

        {/* 1. Revenue vs Target Bar */}
        <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <TrendingUp size={14} className="text-teal-600" />
              Revenue Target Pacing
            </span>
            <span className="font-bold text-slate-900">{pacing}%</span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pacing >= 100
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                  : pacing >= 70
                    ? "bg-gradient-to-r from-blue-500 to-teal-500"
                    : "bg-gradient-to-r from-amber-500 to-rose-500"
              }`}
              style={{ width: `${Math.min(100, pacing)}%` }}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
            <div>
              <p className="text-slate-400">Actual Won Revenue</p>
              <p className="mt-0.5 text-base font-bold text-slate-900">{formatCurrency(node.actualRevenue)}</p>
            </div>
            <div>
              <p className="text-slate-400">Assigned Quota / Target</p>
              <p className="mt-0.5 text-base font-bold text-slate-700">{formatCurrency(node.assignedTarget)}</p>
            </div>
          </div>
        </div>

        {/* 2. Key Rollup Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200/70 bg-white p-3 text-center shadow-2xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Leads</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{node.leadCount.toLocaleString("en-IN")}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{node.leadConversionRate}% conv.</p>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-white p-3 text-center shadow-2xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Customers</p>
            <p className="mt-1 text-lg font-bold text-emerald-700">{node.customerCount.toLocaleString("en-IN")}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">Active accounts</p>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-white p-3 text-center shadow-2xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pipeline</p>
            <p className="mt-1 text-lg font-bold text-blue-700">{formatCurrency(node.pipelineValue)}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">Open deals</p>
          </div>
        </div>

        {/* 3. Capacity & White-Space Decision Box (PRD Section 8) */}
        <div className={`rounded-xl border p-4.5 space-y-4 shadow-sm ${
          isBottleneck
            ? "border-rose-200 bg-rose-50/40"
            : node.whiteSpaceRecommendation.includes("APPOINT_CHANNEL_PARTNER")
              ? "border-indigo-200 bg-indigo-50/30"
              : "border-slate-200 bg-slate-50/50"
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Briefcase size={16} className={isBottleneck ? "text-rose-600" : "text-brand-600"} />
              Capacity &amp; White-Space Decision Engine
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">PRD Sec 8</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-white/80 p-2.5 border border-slate-200/60">
              <p className="text-slate-500">Current Lead Load</p>
              <p className="mt-1 text-base font-bold text-slate-900">{node.leadCount.toLocaleString("en-IN")} leads</p>
            </div>
            <div className="rounded-lg bg-white/80 p-2.5 border border-slate-200/60">
              <p className="text-slate-500">Sales Capacity</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {node.activeHeadcount} rep{node.activeHeadcount === 1 ? "" : "s"}
                <span className="ml-1 text-[11px] font-normal text-slate-400">
                  (Cap: {node.configuredCapacityPerRep}/rep)
                </span>
              </p>
            </div>
          </div>

          {/* Bottleneck Alert */}
          {isBottleneck ? (
            <div className="rounded-lg border border-rose-300 bg-rose-100/70 p-3 text-xs text-rose-950">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-rose-900">
                    ⚠️ {node.headcountGap} Rep Deficit · Critical Bottleneck
                  </p>
                  <p className="mt-1 text-rose-800">
                    Estimated opportunity lost: <strong className="font-bold text-rose-950">{formatCurrency(node.estimatedOpportunityLost)}</strong>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white/80 p-2.5 text-xs text-slate-600">
              <p className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Headcount: {node.activeHeadcount} active reps ({node.requiredHeadcount} required)
              </p>
            </div>
          )}

          {/* Channel Partners In Scope */}
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-indigo-600" />
              Channel Partners active:
            </span>
            <span className="font-bold text-slate-900">{node.channelPartnerCount}</span>
          </div>

          {/* Prescriptive AI Action */}
          <div className="rounded-lg border border-brand-200 bg-brand-50/80 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-semibold text-brand-900">
              <Sparkles size={14} className="text-brand-600" />
              Prescriptive Decision
            </p>
            <p className="mt-1 text-brand-800 leading-relaxed">
              {node.whiteSpaceRecommendation.includes("APPOINT_CHANNEL_PARTNER")
                ? "Appoint a channel partner in this district to capture active demand without fixed payroll overhead."
                : node.whiteSpaceRecommendation.includes("HIRE_SALES_REP")
                  ? `Hire ${node.headcountGap} sales rep${node.headcountGap === 1 ? "" : "s"} immediately to capture ₹${Math.round(node.estimatedOpportunityLost).toLocaleString("en-IN")} in high-converting opportunity.`
                  : node.whiteSpaceRecommendation.includes("REALIGN_TERRITORY")
                    ? "Realign territory assignments to redistribute surplus sales bandwidth to higher-demand regions."
                    : "Maintain current capacity allocation. Lead-to-rep bandwidth remains within optimal operational limits."}
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Action Buttons */}
      <div className="border-t border-slate-200 bg-slate-50/90 p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Link to="/sales/territories" className="w-full">
            <Button variant="secondary" className="w-full text-xs justify-center gap-1.5">
              <UserPlus size={14} />
              Assign Territory
            </Button>
          </Link>
          <Link to="/sales/channel-partners" className="w-full">
            <Button variant="secondary" className="w-full text-xs justify-center gap-1.5">
              <Building2 size={14} />
              Appoint Partner
            </Button>
          </Link>
        </div>

        {canDrillDown && onDrillDown && node.type !== "PINCODE" && (
          <Button
            onClick={() => onDrillDown(node._id)}
            className="w-full justify-center gap-1.5 text-xs bg-teal-700 hover:bg-teal-800 text-white"
          >
            <span>Drill Down into {node.name}</span>
            <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
};
