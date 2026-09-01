"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { SIGNUP_ROLES, type SignupRole } from "@/lib/domain";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer" as SignupRole });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.push(form.role === "buyer" ? "/profile" : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(describeApiError(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <p className="col-span-2 label mb-0">I am a…</p>
        {SIGNUP_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            className={`btn ${form.role === r ? "btn-primary" : "btn-ghost"} capitalize`}
            onClick={() => update("role", r)}
          >
            {r}
          </button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="name">Name / company</label>
        <input id="name" className="input" required value={form.name}
          onChange={(e) => update("name", e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" autoComplete="email" required
          value={form.email} onChange={(e) => update("email", e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password (min 8 characters)</label>
        <input id="password" type="password" className="input" autoComplete="new-password" required
          minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} />
      </div>
      {error && <p className="text-[13px] text-danger-600">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Creating…" : "Create account"}
      </button>
      <p className="text-center text-[13px] text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-brand-700">Sign in</Link>
      </p>
    </form>
  );
}
