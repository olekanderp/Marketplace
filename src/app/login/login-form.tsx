"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { safeNextPath } from "@/lib/format";

const DEMO_PASSWORD = "Password123!";

const DEMO = [
  ["Buyer", "buyer@n5deal.test"],
  ["Seller", "seller@n5deal.test"],
  ["Manager", "manager@n5deal.test"],
] as const;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(nextEmail: string, nextPassword: string) {
    setBusy(true);
    setError(null);
    setEmail(nextEmail);
    setPassword(nextPassword);
    try {
      const res = await apiFetch<{ user: { role: "buyer" | "seller" | "manager" } }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email: nextEmail, password: nextPassword }) },
      );
      router.push(next ?? (res.user.role === "manager" ? "/admin" : "/dashboard"));
      router.refresh();
    } catch (err) {
      setError(describeApiError(err));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void signIn(email, password);
      }}
      className="mt-6 space-y-4"
    >
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="input"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-[13px] text-danger-600">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-[13px] text-muted">
        No account?{" "}
        <Link href="/register" className="font-medium text-brand-700">
          Register
        </Link>
      </p>

      <div className="rounded-xl border border-dashed border-line bg-canvas p-3 text-[12px] text-muted">
        <p className="mb-1 font-medium text-ink">Demo accounts — one per role (password: {DEMO_PASSWORD})</p>
        <div className="flex flex-wrap gap-1.5">
          {DEMO.map(([label, addr]) => (
            <button
              key={addr}
              type="button"
              className="pill !py-0.5 !text-[12px]"
              onClick={() => void signIn(addr, DEMO_PASSWORD)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
