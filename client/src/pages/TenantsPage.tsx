import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Copy,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  CreditCard,
  Settings2,
} from "lucide-react";

import type { PlanTier, SubscriptionStatus, BillingCycle, PlanFeatures } from "@mobius-ems/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { tenantApi, type CreateTenantInput, type TenantItem, type UpdateSubscriptionInput } from "@/features/tenants/tenantApi";

const password = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return `Mb!${Array.from(bytes, (value) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[value % 57]).join("")}9a`;
};

const initialForm = (): CreateTenantInput => ({
  name: "",
  plan: "STANDARD",
  billingCycle: "MONTHLY",
  maxEmployees: 50,
  adminName: "",
  adminEmail: "",
  temporaryPassword: password(),
});

const planColors: Record<PlanTier, string> = {
  STARTER: "bg-slate-100 text-slate-700 border-slate-200",
  STANDARD: "bg-blue-50 text-blue-700 border-blue-200",
  PROFESSIONAL: "bg-violet-50 text-violet-700 border-violet-200",
  ENTERPRISE: "bg-amber-50 text-amber-700 border-amber-200",
  CUSTOM: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const statusColors: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  TRIAL: "bg-sky-50 text-sky-700",
  PAST_DUE: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

export const TenantsPage = () => {
  const user = { tenantId: "" };
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [form, setForm] = useState(initialForm);

  const [subEditForm, setSubEditForm] = useState<{
    plan: PlanTier;
    subscriptionStatus: SubscriptionStatus;
    billingCycle: BillingCycle;
    maxEmployees: number;
    subscriptionEndsAt: string;
    features: PlanFeatures;
  }>({
    plan: "STANDARD",
    subscriptionStatus: "ACTIVE",
    billingCycle: "MONTHLY",
    maxEmployees: 50,
    subscriptionEndsAt: "",
    features: {
      aiEnabled: true,
      salesModuleEnabled: false,
      emailAutomationEnabled: false,
      voiceTasksEnabled: true,
      advancedAnalyticsEnabled: true,
      customRolesEnabled: false,
    },
  });

  const tenants = useQuery({ queryKey: ["platform", "tenants"], queryFn: tenantApi.analytics });

  const create = useMutation({
    mutationFn: tenantApi.create,
    onSuccess: async () => {
      setOpen(false);
      setForm(initialForm());
      await queryClient.invalidateQueries({ queryKey: ["platform", "tenants"] });
    },
  });

  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: "ACTIVE" | "SUSPENDED" }) => tenantApi.updateStatus(id, value),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["platform", "tenants"] }),
  });

  const updateSub = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubscriptionInput }) =>
      tenantApi.updateSubscription(id, input),
    onSuccess: async () => {
      setEditingTenant(null);
      await queryClient.invalidateQueries({ queryKey: ["platform", "tenants"] });
    },
  });

  const update = <K extends keyof CreateTenantInput>(key: K, value: CreateTenantInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openSubEditor = (item: TenantItem) => {
    setEditingTenant(item);
    setSubEditForm({
      plan: item.plan ?? "STANDARD",
      subscriptionStatus: item.subscriptionStatus ?? "ACTIVE",
      billingCycle: item.billingCycle ?? "MONTHLY",
      maxEmployees: item.maxEmployees ?? (item.plan === "ENTERPRISE" ? 0 : 50),
      subscriptionEndsAt: item.subscriptionEndsAt ? item.subscriptionEndsAt.slice(0, 10) : "",
      features: item.features ?? {
        aiEnabled: true,
        salesModuleEnabled: item.plan === "PROFESSIONAL" || item.plan === "ENTERPRISE",
        emailAutomationEnabled: item.plan === "PROFESSIONAL" || item.plan === "ENTERPRISE",
        voiceTasksEnabled: true,
        advancedAnalyticsEnabled: true,
        customRolesEnabled: item.plan === "PROFESSIONAL" || item.plan === "ENTERPRISE",
      },
    });
  };

  return (
    <main className="flex-1 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-700">Independent control plane</p>
            <h1 className="mt-1 text-3xl font-semibold">Vendor & Client Organizations</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage multi-tenant workspaces, plan subscriptions, seat limits, and module entitlements.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={async () => {
                await tenantApi.logout();
                window.location.replace("/platform/login");
              }}
            >
              Sign out
            </Button>
            <Button
              onClick={() => {
                create.reset();
                setOpen(true);
              }}
            >
              <Plus size={16} /> Onboard Organization
            </Button>
          </div>
        </div>

        <div className="mt-6 flex gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-900">
          <ShieldCheck size={19} className="mt-0.5 shrink-0" />
          <p className="text-sm leading-6">
            Each organization operates with full database-backed data isolation, custom plan quotas, and independent starter presets. Suspending an organization terminates access immediately without data loss.
          </p>
        </div>

        {tenants.data && (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Organizations", tenants.data.summary.organizations, Building2],
                ["Active Organizations", tenants.data.summary.activeOrganizations, ShieldCheck],
                ["Total Users Across Tenants", tenants.data.summary.users, Users],
                ["New This Month", tenants.data.growth.at(-1)?.organizations ?? 0, TrendingUp],
              ].map(([label, value, Icon]) => {
                const MetricIcon = Icon as typeof Building2;
                return (
                  <div key={String(label)} className="rounded-2xl border bg-white p-5 shadow-soft">
                    <MetricIcon size={18} className="text-brand-600" />
                    <p className="mt-3 text-2xl font-semibold">{String(value)}</p>
                    <p className="text-xs text-slate-500">{String(label)}</p>
                  </div>
                );
              })}
            </div>
            {tenants.data.growth.length > 0 && (
              <section className="mt-5 rounded-2xl border bg-white p-5 shadow-soft">
                <h2 className="font-semibold">Platform growth</h2>
                <div className="mt-4 flex items-end gap-3 overflow-x-auto">
                  {tenants.data.growth.slice(-12).map((item) => (
                    <div className="min-w-20 flex-1" key={item.month}>
                      <div className="flex h-28 items-end gap-1">
                        <div
                          title={`${item.organizations} organizations`}
                          className="w-1/2 rounded-t bg-brand-500"
                          style={{ height: `${Math.max(8, item.organizations * 12)}px` }}
                        />
                        <div
                          title={`${item.users} users`}
                          className="w-1/2 rounded-t bg-violet-300"
                          style={{ height: `${Math.max(8, item.users * 6)}px` }}
                        />
                      </div>
                      <p className="mt-2 text-center text-[10px] text-slate-400">{item.month}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Monthly registrations: <span className="text-brand-600">organizations</span> and{" "}
                  <span className="text-violet-600">users</span>.
                </p>
              </section>
            )}
          </>
        )}

        <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-soft">
          <div className="border-b px-5 py-4 flex items-center justify-between">
            <h2 className="font-semibold">All Organizations & Subscriptions</h2>
            <span className="text-xs text-slate-400">
              {tenants.data?.items.length ?? 0} organizations enrolled
            </span>
          </div>
          {tenants.isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : tenants.error ? (
            <p className="p-8 text-center text-sm text-red-600">{tenants.error.message}</p>
          ) : (
            <div className="divide-y">
              {tenants.data?.items.map((item) => {
                const plan = item.plan ?? "STANDARD";
                const subStatus = item.subscriptionStatus ?? "ACTIVE";
                const isUnlimited = item.maxEmployees === 0 || item.maxEmployees === -1;
                const employeeCount = item.employeeCount ?? 0;
                const maxSeats = item.maxEmployees ?? (plan === "ENTERPRISE" ? 0 : 50);

                return (
                  <div key={item._id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                      <Building2 size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${planColors[plan] ?? planColors.STANDARD}`}>
                          {plan}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[subStatus] ?? statusColors.ACTIVE}`}>
                          {subStatus}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Org ID: <span className="font-mono text-slate-700">{item.slug}</span> ·{" "}
                        <strong className="text-slate-800">{employeeCount}</strong> / {isUnlimited ? "Unlimited" : maxSeats} seats used ·{" "}
                        {item.userCount ?? 0} logins · {item.industry ?? "General"}
                      </p>
                      {item.subscriptionEndsAt && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Subscription renewal: {new Date(item.subscriptionEndsAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:ml-auto">
                      <Button
                        variant="secondary"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => openSubEditor(item)}
                      >
                        <CreditCard size={13} /> Manage Plan
                      </Button>
                      {item._id !== user?.tenantId && item.status !== "PROVISIONING" && (
                        <button
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          disabled={status.isPending}
                          onClick={() =>
                            status.mutate({
                              id: item._id,
                              value: item.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                            })
                          }
                        >
                          {item.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!tenants.data?.items.length && (
                <p className="p-10 text-center text-sm text-slate-400">No organizations found.</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Provision Organization Modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/35 p-4 backdrop-blur-sm">
          <form
            className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate(form);
            }}
          >
            <div className="flex items-start">
              <div>
                <h2 className="text-xl font-semibold">Onboard New Organization</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Provisions workspace, seeds starter departments & designations, and initializes subscription plan.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="ml-auto grid size-9 place-items-center rounded-lg hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">
                Organization name
                <Input
                  required
                  minLength={2}
                  className="mt-2"
                  placeholder="e.g. Acme Corp"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Admin name
                <Input
                  required
                  minLength={2}
                  className="mt-2"
                  placeholder="Primary Administrator"
                  value={form.adminName}
                  onChange={(event) => update("adminName", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Admin email
                <Input
                  required
                  type="email"
                  className="mt-2"
                  placeholder="admin@acme.com"
                  value={form.adminEmail}
                  onChange={(event) => update("adminEmail", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Plan Tier
                <select
                  className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm"
                  value={form.plan}
                  onChange={(event) => {
                    const plan = event.target.value as PlanTier;
                    const seats = plan === "STARTER" ? 15 : plan === "STANDARD" ? 50 : plan === "PROFESSIONAL" ? 150 : 0;
                    setForm((f) => ({ ...f, plan, maxEmployees: seats }));
                  }}
                >
                  <option value="STARTER">Starter (15 seats - Core HR, Tasks)</option>
                  <option value="STANDARD">Standard (50 seats - Core HR, AI Workspace)</option>
                  <option value="PROFESSIONAL">Professional (150 seats - Sales CRM, Brevo Automation)</option>
                  <option value="ENTERPRISE">Enterprise (Unlimited - All Modules)</option>
                  <option value="CUSTOM">Custom Contract</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Seat Limit (Max Employees)
                <Input
                  type="number"
                  min={0}
                  className="mt-2"
                  placeholder="0 for Unlimited"
                  value={form.maxEmployees ?? 50}
                  onChange={(event) => update("maxEmployees", Number(event.target.value))}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Temporary password
                <div className="mt-2 flex gap-2">
                  <Input
                    required
                    minLength={12}
                    value={form.temporaryPassword}
                    onChange={(event) => update("temporaryPassword", event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    aria-label="Copy password"
                    onClick={() => void navigator.clipboard.writeText(form.temporaryPassword)}
                  >
                    <Copy size={15} />
                  </Button>
                </div>
              </label>
            </div>
            {create.error && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{create.error.message}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={create.isPending}>
                {create.isPending ? "Provisioning…" : "Onboard Organization"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Manage Plan & Subscription Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/35 p-4 backdrop-blur-sm">
          <form
            className="my-6 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              updateSub.mutate({
                id: editingTenant._id,
                input: {
                  plan: subEditForm.plan,
                  subscriptionStatus: subEditForm.subscriptionStatus,
                  billingCycle: subEditForm.billingCycle,
                  maxEmployees: Number(subEditForm.maxEmployees),
                  subscriptionEndsAt: subEditForm.subscriptionEndsAt ? new Date(subEditForm.subscriptionEndsAt).toISOString() : undefined,
                  features: subEditForm.features,
                },
              });
            }}
          >
            <div className="flex items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Settings2 size={18} className="text-brand-600" />
                  <h2 className="text-xl font-semibold">Subscription & Plan Control</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Configure subscription tier, seat quotas, and enabled modules for <strong>{editingTenant.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="ml-auto grid size-9 place-items-center rounded-lg hover:bg-slate-100"
                onClick={() => setEditingTenant(null)}
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Plan Tier
                <select
                  className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm"
                  value={subEditForm.plan}
                  onChange={(e) => {
                    const nextPlan = e.target.value as PlanTier;
                    setSubEditForm((prev) => ({
                      ...prev,
                      plan: nextPlan,
                      maxEmployees: nextPlan === "STARTER" ? 15 : nextPlan === "STANDARD" ? 50 : nextPlan === "PROFESSIONAL" ? 150 : 0,
                      features: {
                        ...prev.features,
                        aiEnabled: nextPlan !== "STARTER",
                        salesModuleEnabled: nextPlan === "PROFESSIONAL" || nextPlan === "ENTERPRISE",
                        emailAutomationEnabled: nextPlan === "PROFESSIONAL" || nextPlan === "ENTERPRISE",
                        advancedAnalyticsEnabled: nextPlan !== "STARTER",
                        customRolesEnabled: nextPlan === "PROFESSIONAL" || nextPlan === "ENTERPRISE",
                      },
                    }));
                  }}
                >
                  <option value="STARTER">STARTER (15 seats)</option>
                  <option value="STANDARD">STANDARD (50 seats)</option>
                  <option value="PROFESSIONAL">PROFESSIONAL (150 seats)</option>
                  <option value="ENTERPRISE">ENTERPRISE (Unlimited)</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Subscription Status
                <select
                  className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm"
                  value={subEditForm.subscriptionStatus}
                  onChange={(e) => setSubEditForm((p) => ({ ...p, subscriptionStatus: e.target.value as SubscriptionStatus }))}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIAL">TRIAL</option>
                  <option value="PAST_DUE">PAST_DUE</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Seat Limit (Max Employees)
                <Input
                  type="number"
                  min={0}
                  className="mt-2"
                  value={subEditForm.maxEmployees}
                  onChange={(e) => setSubEditForm((p) => ({ ...p, maxEmployees: Number(e.target.value) }))}
                />
                <span className="mt-1 block text-[11px] text-slate-400">Set 0 for unlimited employees.</span>
              </label>

              <label className="text-sm font-medium">
                Expiration / Renewal Date
                <Input
                  type="date"
                  className="mt-2"
                  value={subEditForm.subscriptionEndsAt}
                  onChange={(e) => setSubEditForm((p) => ({ ...p, subscriptionEndsAt: e.target.value }))}
                />
              </label>

              <div className="sm:col-span-2 pt-2 border-t">
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-3">
                  Module Feature Gates
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subEditForm.features.aiEnabled}
                      onChange={(e) =>
                        setSubEditForm((p) => ({
                          ...p,
                          features: { ...p.features, aiEnabled: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    AI Workspace & Summaries
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subEditForm.features.salesModuleEnabled}
                      onChange={(e) =>
                        setSubEditForm((p) => ({
                          ...p,
                          features: { ...p.features, salesModuleEnabled: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Sales CRM & Pipeline
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subEditForm.features.emailAutomationEnabled}
                      onChange={(e) =>
                        setSubEditForm((p) => ({
                          ...p,
                          features: { ...p.features, emailAutomationEnabled: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Email Campaigns (Brevo)
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subEditForm.features.voiceTasksEnabled}
                      onChange={(e) =>
                        setSubEditForm((p) => ({
                          ...p,
                          features: { ...p.features, voiceTasksEnabled: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Voice Task Capture
                  </label>
                </div>
              </div>
            </div>

            {updateSub.error && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{updateSub.error.message}</p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingTenant(null)}>
                Cancel
              </Button>
              <Button disabled={updateSub.isPending}>
                {updateSub.isPending ? "Saving..." : "Save Subscription Changes"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};
