import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Users,
  Sparkles,
  Calendar,
  Send,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { tenantApi } from "@/features/tenants/tenantApi";
import { useAuth } from "@/features/auth/AuthProvider";

export const SubscriptionPage = () => {
  const { user } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [requestedPlan, setRequestedPlan] = useState("ENTERPRISE");
  const [requestedSeats, setRequestedSeats] = useState(50);
  const [requestNote, setRequestNote] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);

  const query = useQuery({
    queryKey: ["organization", "subscription"],
    queryFn: tenantApi.getOrganizationSubscription,
  });

  const upgradeMutation = useMutation({
    mutationFn: tenantApi.requestUpgrade,
    onSuccess: () => {
      setRequestSuccess(true);
      setTimeout(() => {
        setUpgradeModalOpen(false);
        setRequestSuccess(false);
        setRequestNote("");
      }, 2500);
    },
  });

  const sub = query.data?.subscription;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const percentUsed = sub && !sub.isUnlimited && sub.maxEmployees > 0
    ? Math.min(100, Math.round((sub.activeEmployeeCount / sub.maxEmployees) * 100))
    : 0;

  const featureList = [
    { key: "aiEnabled", label: "AI Workspace & Summaries", desc: "AI-assisted evaluations, JD generator, and intelligence assistant" },
    { key: "salesModuleEnabled", label: "Sales Intelligence & CRM", desc: "Lead tracking, pipeline conversion, commission simulation, and quotas" },
    { key: "emailAutomationEnabled", label: "Email Automation (Brevo)", desc: "Automated vendor onboarding and drip email campaigns" },
    { key: "voiceTasksEnabled", label: "Voice Task Capture", desc: "Multilingual offline voice-to-task commands and transcriptions" },
    { key: "advancedAnalyticsEnabled", label: "Advanced Analytics & Heatmaps", desc: "Workforce load balancing, role gap heatmaps, and executive metrics" },
    { key: "customRolesEnabled", label: "Custom Roles & Permissions", desc: "Granular RBAC beyond standard system roles" },
  ] as const;

  return (
    <main className="flex-1 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-[1100px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-700">Organization Plan & Billing</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Subscription & Quotas</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage your workforce tier, seat allocation, and feature entitlements for <strong>{user?.tenantName}</strong>.
            </p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => setUpgradeModalOpen(true)} className="gap-2">
              <Sparkles size={16} /> Upgrade Plan / Add Seats
            </Button>
          )}
        </div>

        {query.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : query.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {query.error.message}
          </div>
        ) : sub ? (
          <>
            {/* Plan Overview Card */}
            <div className="grid gap-5 md:grid-cols-3">
              {/* Plan Tier */}
              <section className="rounded-2xl border bg-white p-6 shadow-soft flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        sub.subscriptionStatus === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : sub.subscriptionStatus === "TRIAL"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {sub.subscriptionStatus}
                    </span>
                  </div>
                  <h2 className="mt-4 text-3xl font-extrabold text-slate-900">{sub.planName}</h2>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{sub.planDescription}</p>
                </div>
                <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-slate-500">
                  <span>Billing cycle</span>
                  <strong className="font-semibold text-slate-800">{sub.billingCycle}</strong>
                </div>
              </section>

              {/* Seat Quota */}
              <section className="rounded-2xl border bg-white p-6 shadow-soft flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Seat Utilization</span>
                    <Users size={16} className="text-brand-600" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-slate-900">{sub.activeEmployeeCount}</span>
                    <span className="text-sm font-medium text-slate-500">
                      / {sub.isUnlimited ? "Unlimited" : `${sub.maxEmployees} seats`}
                    </span>
                  </div>
                  {!sub.isUnlimited && (
                    <div className="mt-4">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full transition-all ${
                            percentUsed > 90 ? "bg-red-500" : percentUsed > 75 ? "bg-amber-500" : "bg-brand-500"
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-slate-500">
                        <span>{percentUsed}% capacity used</span>
                        <span>{sub.seatsRemaining} seats available</span>
                      </div>
                    </div>
                  )}
                  {sub.isUnlimited && (
                    <p className="mt-3 text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Enterprise unmetered seat capacity
                    </p>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t text-xs text-slate-500">
                  {sub.seatsRemaining <= 3 && !sub.isUnlimited ? (
                    <span className="text-amber-700 font-medium">Running low on employee seats!</span>
                  ) : (
                    <span>Allocated for current active workforce</span>
                  )}
                </div>
              </section>

              {/* Renewal & Expiry */}
              <section className="rounded-2xl border bg-white p-6 shadow-soft flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Subscription Period</span>
                    <Calendar size={16} className="text-violet-600" />
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {sub.daysRemaining !== undefined ? `${sub.daysRemaining}d` : "Active"}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      {sub.daysRemaining !== undefined ? "Remaining until renewal" : "Standard subscription term"}
                    </p>
                  </div>
                  {sub.subscriptionEndsAt && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                      Renewal date: <strong>{new Date(sub.subscriptionEndsAt).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-slate-500">
                  <span>Support tier</span>
                  <strong className="font-semibold text-slate-800">
                    {sub.plan === "ENTERPRISE" ? "Dedicated 24/7 Priority" : "Standard Business"}
                  </strong>
                </div>
              </section>
            </div>

            {/* Feature Entitlements Checklist */}
            <section className="rounded-2xl border bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="font-semibold text-base text-slate-900">Included Feature Modules</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Module permissions available under the <strong>{sub.planName}</strong> plan.
                  </p>
                </div>
                <span className="text-xs font-medium text-brand-700">Plan Matrix</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featureList.map((feature) => {
                  const isEnabled = Boolean(sub.features[feature.key]);
                  return (
                    <div
                      key={feature.key}
                      className={`rounded-xl border p-4 transition ${
                        isEnabled ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-slate-50/60 opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-sm text-slate-900">{feature.label}</p>
                        {isEnabled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <CheckCircle2 size={11} /> Included
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            <XCircle size={11} /> Upgrade
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}

        {/* Upgrade / Expansion Modal */}
        {upgradeModalOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/35 p-4 backdrop-blur-sm">
            <form
              className="my-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              onSubmit={(e) => {
                e.preventDefault();
                upgradeMutation.mutate({
                  plan: requestedPlan,
                  seats: Number(requestedSeats),
                  note: requestNote,
                });
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Request Subscription Upgrade</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Expand seat quota or unlock enterprise CRM and AI modules.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
                  onClick={() => setUpgradeModalOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {requestSuccess ? (
                <div className="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
                  <p className="mt-2 font-semibold text-emerald-900">Request Sent Successfully</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Our platform administrators will update your subscription and contact you shortly.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <label className="block text-sm font-medium">
                    Target Plan Tier
                    <select
                      className="mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-sm"
                      value={requestedPlan}
                      onChange={(e) => setRequestedPlan(e.target.value)}
                    >
                      <option value="STANDARD">Standard (50 seats - Core HR, AI Workspace)</option>
                      <option value="PROFESSIONAL">Professional (150 seats - Sales CRM, Brevo Automation)</option>
                      <option value="ENTERPRISE">Enterprise (Unlimited Seats & Modules)</option>
                      <option value="CUSTOM">Custom Enterprise Contract</option>
                    </select>
                  </label>

                  <label className="block text-sm font-medium">
                    Desired Seat Count
                    <Input
                      type="number"
                      min={sub?.activeEmployeeCount ?? 1}
                      className="mt-1.5"
                      value={requestedSeats}
                      onChange={(e) => setRequestedSeats(Number(e.target.value))}
                    />
                    <span className="mt-1 block text-[11px] text-slate-400">
                      Currently using {sub?.activeEmployeeCount ?? 0} seats.
                    </span>
                  </label>

                  <label className="block text-sm font-medium">
                    Additional Requirements / Comments
                    <textarea
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                      placeholder="e.g. Need dedicated onboarding assistance, custom billing invoice, etc."
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                    />
                  </label>

                  {upgradeMutation.error && (
                    <p className="text-xs text-red-600">{upgradeMutation.error.message}</p>
                  )}

                  <div className="mt-6 flex justify-end gap-2 pt-3 border-t">
                    <Button type="button" variant="ghost" onClick={() => setUpgradeModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button disabled={upgradeMutation.isPending} className="gap-2">
                      <Send size={14} />
                      {upgradeMutation.isPending ? "Sending..." : "Submit Upgrade Request"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </main>
  );
};
