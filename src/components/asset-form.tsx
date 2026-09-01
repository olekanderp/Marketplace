"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { parseDigits } from "@/lib/format";
import {
  BUSINESS_STATUSES,
  BUSINESS_STATUS_LABELS,
  COUNTRIES,
  CURRENCIES,
  SECTORS,
  SECTOR_LABELS,
  type BusinessStatus,
  type Currency,
  type Sector,
  type SellerAssetStatus,
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
  status: SellerAssetStatus;
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
  locked = false,
}: {
  mode: "create" | "edit";
  assetId?: string;
  initial: AssetFormValues;
  locked?: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState<AssetFormValues>(initial);
  const [highlights, setHighlights] = useState(initial.highlights.join(", "));
  const [priceText, setPriceText] = useState(initial.askingPrice?.toString() ?? "");
  const [yearText, setYearText] = useState(initial.yearIssued?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof AssetFormValues>(k: K, value: AssetFormValues[K]) =>
    setV((prev) => ({ ...prev, [k]: value }));

  async function save(nextStatus?: SellerAssetStatus) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const payload = {
        ...v,
        status: nextStatus ?? v.status,
        askingPrice: parseDigits(priceText),
        yearIssued: parseDigits(yearText),
        highlights: highlights
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        employees: v.employees?.trim() || null,
        regulator: v.regulator?.trim() || null,
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
      if (mode === "create") {
        router.push(`/listings/${res.asset.slug}`);
      } else {
        if (nextStatus) set("status", nextStatus);
        setSaved(true);
      }
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/assets/${assetId}`, { method: "DELETE" });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(describeApiError(err));
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
      {locked && (
        <div className="rounded-xl border border-danger-600/30 bg-danger-50 p-3 text-[13px] text-danger-600">
          This listing was suspended by the platform team. You can still edit the content, but only
          the platform can put it back on the marketplace.
        </div>
      )}

      <div>
        <label className="label" htmlFor="title">
          Listing title
        </label>
        <input
          id="title"
          className="input"
          required
          minLength={4}
          maxLength={160}
          value={v.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="sector">
            Sector
          </label>
          <select
            id="sector"
            className="input"
            value={v.sector}
            onChange={(e) => set("sector", e.target.value as Sector)}
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {SECTOR_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="licenseType">
            Licence type
          </label>
          <input
            id="licenseType"
            className="input"
            placeholder="e.g. EMI, API, CASP"
            value={v.licenseType}
            onChange={(e) => set("licenseType", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="country">
            Country
          </label>
          <input
            id="country"
            className="input"
            required
            list="country-options"
            value={v.country}
            onChange={(e) => set("country", e.target.value)}
          />
          <datalist id="country-options">
            {COUNTRIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label" htmlFor="businessStatus">
            Business status
          </label>
          <select
            id="businessStatus"
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
          <label className="label" htmlFor="price">
            Asking price (leave blank for “on LOI”)
          </label>
          <input
            id="price"
            className="input"
            inputMode="numeric"
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="currency">
            Currency
          </label>
          <select
            id="currency"
            className="input"
            value={v.currency}
            onChange={(e) => set("currency", e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="year">
            Year of issue
          </label>
          <input
            id="year"
            className="input"
            inputMode="numeric"
            value={yearText}
            onChange={(e) => setYearText(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="employees">
            Employees
          </label>
          <input
            id="employees"
            className="input"
            value={v.employees ?? ""}
            onChange={(e) => set("employees", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="regulator">
            Regulator
          </label>
          <input
            id="regulator"
            className="input"
            value={v.regulator ?? ""}
            onChange={(e) => set("regulator", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="highlights">
          Included highlights (comma-separated)
        </label>
        <input
          id="highlights"
          className="input"
          placeholder="SEPA direct participant, Own BIC, Card BIN sponsorship"
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="description">
          Company overview
        </label>
        <textarea
          id="description"
          className="input min-h-40"
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      {warnings.length > 0 && (
        <div className="rounded-xl border border-warn-600/30 bg-warn-50 p-3">
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

        {!locked && (
          <button
            type="button"
            className="btn-brand"
            disabled={busy}
            onClick={() => void save(v.status === "published" ? "draft" : "published")}
          >
            {v.status === "published" ? "Unpublish" : "Publish"}
          </button>
        )}

        {mode === "edit" && (
          <button
            type="button"
            className="btn-ghost ml-auto text-danger-600"
            disabled={busy}
            onClick={() => (confirmDelete ? void remove() : setConfirmDelete(true))}
            onBlur={() => setConfirmDelete(false)}
          >
            {confirmDelete ? "Click again to confirm" : "Delete listing"}
          </button>
        )}

        <span className="text-[13px] text-muted">
          Status: {locked ? "suspended by platform" : v.status}
        </span>
        {saved && <span className="text-[13px] text-positive-700">Saved ✓</span>}
      </div>
    </form>
  );
}
