import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const RegisterPage = () => {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token"));
  const [form, setForm] = useState({ name: "", slug: "", adminName: "", adminEmail: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-brand-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-soft">
        <p className="text-sm font-medium text-brand-700">MobiusEMS</p>
        <h1 className="mt-2 text-2xl font-semibold">
          {complete
            ? "Registration complete!"
            : token
            ? "Finish organization registration"
            : "Register your organization"}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {complete
            ? "Your organization has been successfully created."
            : token
            ? "Choose a secure administrator password to create your workspace."
            : "Create a separate workspace for your team. Verify your email to get started."}
        </p>

        {complete ? (
          <div className="mt-6 space-y-4">
            <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              {message}
            </p>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              Go to Sign In
            </Link>
          </div>
        ) : message && !token ? (
          <div className="mt-6 space-y-4">
            <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              {message}
            </p>
            <button
              type="button"
              className="text-sm font-medium text-brand-700 underline"
              onClick={() => {
                setMessage("");
                setError("");
              }}
            >
              Try again or correct email
            </button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              setError("");
              try {
                if (token) {
                  const result = await api.post<{ slug: string }>("/api/v1/registration/complete", {
                    token,
                    password: form.password,
                  });
                  setMessage(
                    `Your organization is ready! Organization ID: ${result.slug}. Sign in with your registered email and chosen password.`
                  );
                  setComplete(true);
                  window.history.replaceState(null, "", "/register");
                } else {
                  const result = await api.post<{
                    emailSent?: boolean;
                    token?: string;
                    verificationUrl?: string;
                  }>("/api/v1/registration/request", {
                    name: form.name,
                    slug: form.slug,
                    adminName: form.adminName,
                    adminEmail: form.adminEmail,
                  });

                  if (result?.token) {
                    setToken(result.token);
                    window.location.hash = new URLSearchParams({ token: result.token }).toString();
                    setMessage("Email could not be sent to your inbox. You can create your administrator password below to finish registration directly.");
                  } else {
                    setMessage("Check your inbox and spam folder for the verification link. It expires in 30 minutes.");
                  }
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
              } finally {
                setPending(false);
              }
            }}
          >
            {message && token && (
              <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                {message}
              </p>
            )}

            {!token && (
              <>
                <label className="block text-sm font-medium">
                  Organization name
                  <Input
                    className="mt-2"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="e.g. Acme Corporation"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Organization ID
                  <Input
                    className="mt-2"
                    required
                    maxLength={63}
                    pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
                    placeholder="acme-corp"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    Use lowercase letters, numbers and hyphens. This is your company workspace identifier.
                  </span>
                </label>
                <label className="block text-sm font-medium">
                  Your name
                  <Input
                    className="mt-2"
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    placeholder="e.g. John Doe"
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Work email
                  <Input
                    className="mt-2"
                    required
                    type="email"
                    maxLength={254}
                    autoComplete="email"
                    placeholder="admin@company.com"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                  />
                </label>
              </>
            )}

            {token && (
              <label className="block text-sm font-medium">
                Administrator password
                <Input
                  className="mt-2"
                  required
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  At least 12 characters with uppercase, lowercase, a number and a symbol.
                </span>
              </label>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button className="w-full" disabled={pending}>
              {pending ? "Please wait…" : token ? "Create organization" : "Continue"}
            </Button>
          </form>
        )}

        <Link className="mt-6 block text-sm font-medium text-brand-700" to="/login">
          Already registered? Sign in
        </Link>
      </section>
    </main>
  );
};
