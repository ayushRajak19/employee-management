import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const RegisterPage = () => {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token"));
  const [form, setForm] = useState({ name: "", slug: "", adminName: "", adminEmail: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);
  return <main className="grid min-h-screen place-items-center bg-brand-50 px-4 py-10"><section className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-soft">
    <p className="text-sm font-medium text-brand-700">Whalexy</p><h1 className="mt-2 text-2xl font-semibold">{token ? "Finish organization registration" : "Register your organization"}</h1>
    <p className="mt-3 text-sm text-slate-500">{token ? "Choose a secure administrator password to create your workspace." : "Create a separate workspace for your team. Verify your email to get started."}</p>
    {!message && <form className="mt-6 space-y-4" onSubmit={async (event) => {
      event.preventDefault(); setPending(true); setError("");
      try {
        if (token) {
          const result = await api.post<{ slug: string }>("/api/v1/registration/complete", { token, password: form.password });
          setMessage(`Your organization is ready. Organization ID: ${result.slug}. Sign in with your verified email and chosen password.`); setComplete(true);
          window.history.replaceState(null, "", "/register");
        } else {
          await api.post("/api/v1/registration/request", { name: form.name, slug: form.slug, adminName: form.adminName, adminEmail: form.adminEmail });
          setMessage("Check your inbox and spam folder for the verification link. It expires in 30 minutes.");
        }
      } catch (err) { setError(err instanceof Error ? err.message : "Registration failed. Please try again."); }
      finally { setPending(false); }
    }}>
      {!token && <>
        <label className="block text-sm font-medium">Organization name<Input className="mt-2" required minLength={2} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
        <label className="block text-sm font-medium">Organization ID<Input className="mt-2" required maxLength={63} pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?" placeholder="your-company" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}/><span className="mt-1 block text-xs text-slate-500">Use lowercase letters, numbers and hyphens.</span></label>
        <label className="block text-sm font-medium">Your name<Input className="mt-2" required minLength={2} maxLength={120} autoComplete="name" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })}/></label>
        <label className="block text-sm font-medium">Work email<Input className="mt-2" required type="email" maxLength={254} autoComplete="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}/></label>
      </>}
      {token && <label className="block text-sm font-medium">Administrator password<Input className="mt-2" required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/><span className="mt-1 block text-xs text-slate-500">At least 12 characters with uppercase, lowercase, a number and a symbol.</span></label>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" disabled={pending}>{pending ? "Please wait…" : token ? "Create organization" : "Send verification email"}</Button>
    </form>}
    {message && <p role="status" className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    {message && !complete && <button className="mt-4 text-sm text-brand-700" onClick={() => setMessage("")}>Try again or correct email</button>}
    <Link className="mt-6 block text-sm font-medium text-brand-700" to="/login">Already registered? Sign in</Link>
  </section></main>;
};
