"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { CURRENCIES, SECTORS, SECTOR_LABELS, type Currency, type Sector } from "@/lib/domain";

interface Values {
  headline: string;
  bio: string;
  mandate: string;
  targetSectors: Sector[];
  targetJurisdictions: string[];
  ticketMin: number | null;
  ticketMax: number | null;
  currency: Currency;
}

export function BuyerProfileForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [jurisdictions, setJurisdictions] = useState(initial.targetJurisdictions.join(", "));
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  function toggleSector(s: Sector) {
    setV((prev) => ({
      ...prev,
      targetSectors: prev.targetSectors.includes(s)
        ? prev.targetSectors.filter((x) => x !== s)
        : [...prev.targetSectors, s],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setError(null);
    try {
      await apiFetch("/api/me/buyer-profile", {
        method: "PUT",
        body: JSON.stringify({
          ...v,
          targetJurisdictions: jurisdictions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      setState("saved");
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      setError(describeApiError(err));
      setState("idle");
    }
  }

  const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(/\D/g, "")));

  return (
    <form onSubmit={submit} className="card space-y-5 p-5">
      <div>
        <label className="label">Headline</label>
        <input
          className="input"
          maxLength={160}
          placeholder="e.g. Nordic PSP consolidating EEA payment licences"
          value={v.headline}
          onChange={(e) => setV({ ...v, headline: e.target.value })}
        />
      </div>

      <div>
        <label className="label">About you</label>
        <textarea
          className="input min-h-20"
          value={v.bio}
          onChange={(e) => setV({ ...v, bio: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Investment / acquisition interests</label>
        <textarea
          className="input min-h-28"
          placeholder="What are you looking to acquire? Licence types, size, timeline, deal breakers…"
          value={v.mandate}
          onChange={(e) => setV({ ...v, mandate: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Target sectors</label>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <button
              key={s}
              type="button"
              className={`pill ${v.targetSectors.includes(s) ? "pill-active" : ""}`}
              onClick={() => toggleSector(s)}
            >
              {SECTOR_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Target jurisdictions (comma-separated)</label>
        <input
          className="input"
          placeholder="Lithuania, Germany, Estonia"
          value={jurisdictions}
          onChange={(e) => setJurisdictions(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Ticket min</label>
          <input
            className="input"
            inputMode="numeric"
            value={v.ticketMin ?? ""}
            onChange={(e) => setV({ ...v, ticketMin: num(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Ticket max</label>
          <input
            className="input"
            inputMode="numeric"
            value={v.ticketMax ?? ""}
            onChange={(e) => setV({ ...v, ticketMax: num(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Currency</label>
          <select
            className="input"
            value={v.currency}
            onChange={(e) => setV({ ...v, currency: e.target.value as Currency })}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-[13px] text-danger-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Save mandate"}
        </button>
        {state === "saved" && <span className="text-[13px] text-positive-700">Saved ✓</span>}
      </div>
    </form>
  );
}
