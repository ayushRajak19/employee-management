import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const PlatformLoginPage = () => {
  const navigate = useNavigate(); const [form, setForm] = useState({ email: "", password: "" }); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  return <main className="grid min-h-screen place-items-center bg-slate-950 p-4"><form className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl" onSubmit={async (event) => { event.preventDefault(); setPending(true); setError(""); try { await api.post("/api/v1/platform/auth/login", form); navigate("/platform/tenants", { replace: true }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign in"); } finally { setPending(false); } }}><p className="text-sm font-semibold text-brand-700">MobiusEMS Control Plane</p><h1 className="mt-2 text-2xl font-semibold">Platform Owner</h1><p className="mt-2 text-sm text-slate-500">Separate from every vendor and employee workspace.</p><label className="mt-6 block text-sm font-medium">Owner email<Input required type="email" autoComplete="username" className="mt-2" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label><label className="mt-4 block text-sm font-medium">Password<Input required minLength={12} type="password" autoComplete="current-password" className="mt-2" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}/></label>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<Button className="mt-6 w-full" disabled={pending}>{pending ? "Signing in…" : "Open owner dashboard"}</Button></form></main>;
};
