"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import {
  BUSINESS_STATUSES,
  BUSINESS_STATUS_LABELS,
  CURRENCIES,
  SECTORS,
  SECTOR_LABELS,
  type BusinessStatus,
  type Currency,
  type Sector,
} from "@/lib/domain";

export interface AssetFormValues {
  title: string;
  description: string;
  sector: Sector;
  licenseType: string;
  country: string;
  businessStatus: BusinessStatus;
  askingPrice: number | null;
  currency: Currency;
  yearIssued: number | null;
  employees: string | null;
  regulator: string | null;
  highlights: string[];
  status: "draft" | "published";
}

export const EMPTY_ASSET: AssetFormValues = {
  title: "",
  description: "",
  sector: "payment",
  licenseType: "",
  country: "",
  businessStatus: "active",
  askingPrice: null,
  currency: "EUR",
  yearIssued: null,
  employees: null,
  regulator: null,
  highlights: [],
  status: "draft",
};

export function AssetForm({
  mode,
  assetId,
  initial,
}: {
  mode: "create" | "edit";
  assetId?: string;
  initial: AssetFormValues;
}) {
  const router = useRouter();
  const [v, setV] = useState<AssetFormValues>(initial);
  const [highlights, setHighlights] = useState(initial.highlights.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const set = <K extends keyof AssetFormValues>(k: K, value: AssetFormValues[K]) =>
    setV((prev) => ({ ...prev, [k]: value }));
  const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(/[^\d]/g, "")));

  async function save(publish?: boolean) {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...v,
        status: publish ? "published" : v.status,
        highlights: highlights.split(",").map((s) => s.trim()).filter(Boolean),
        employees: v.employees || null,
        regulator: v.regulator || null,
      };
      const res =
        mode === "create"
          ? await apiFetch<{ asset: { slug: string }; warnings: string[] }>("/api/assets", {
              method: "POST",
              body: JSON.stringify(payload),
            })
          : await apiFetch<{ asset: { slug: string }; warnings: string[] }>(
              `/api/assets/${assetId}`,
              { method: "PATCH", body: JSON.stringify(payload) },
            );
      setWarnings(res.warnings ?? []);
      router.refresh();
      if (mode === "create") router.push(`/listings/${res.asset.slug}`);
      else if (publish) setV((p) => ({ ...p, status: "published" }));
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="card space-y-5 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div>
        <label className="label">Listing title</label>
        <input
          className="input"
          required
          minLength={4}
          value={v.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Sector</label>
          <select className="input" value={v.sector} onChange={(e) => set("sector", e.target.value as Sector)}>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {SECTOR_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Licence type</label>
          <input
            className="input"
            placeholder="e.g. EMI, API, CASP"
            value={v.licenseType}
            onChange={(e) => set("licenseType", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Country</label>
          <input
            className="input"
            required
            value={v.country}
            onChange={(e) => set("country", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Business status</label>
          <select
            className="input"
            value={v.businessStatus}
            onChange={(e) => set("businessStatus", e.target.value as BusinessStatus)}
          >
            {BUSINESS_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BUSINESS_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Asking price (blank = on LOI)</label>
          <input
            className="input"
            inputMode="numeric"
            value={v.askingPrice ?? ""}
            onChange={(e) => set("askingPrice", num(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input" value={v.currency} onChange={(e) => set("currency", e.target.value as Currency)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year of issue</label>
          <input
            className="input"
            inputMode="numeric"
            value={v.yearIssued ?? ""}
            onChange={(e) => set("yearIssued", num(e.target.value))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Employees</label>
          <input
            className="input"
            value={v.employees ?? ""}
            onChange={(e) => set("employees", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Regulator</label>
          <input
            className="input"
            value={v.regulator ?? ""}
            onChange={(e) => set("regulator", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Included highlights (comma-separated)</label>
        <input
          className="input"
          placeholder="SEPA direct participant, Own BIC, Card BIN sponsorship"
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Company overview</label>
        <textarea
          className="input min-h-40"
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      {warnings.length > 0 && (
        <div className="card border-warn-600/30 bg-warn-50 p-3">
          <p className="text-[13px] font-medium text-warn-600">Smart validation</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-[13px] text-warn-600">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="text-[13px] text-danger-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button className="btn-ghost" disabled={busy} type="submit">
          {busy ? "Saving…" : mode === "create" ? "Save as draft" : "Save changes"}
        </button>
        <button
          type="button"
          className="btn-brand"
          disabled={busy}
          onClick={() => void save(true)}
        >
          {v.status === "published" ? "Save & keep published" : "Publish"}
        </button>
        <span className="text-[13px] text-muted">Current status: {v.status}</span>
      </div>
    </form>
  );
}
