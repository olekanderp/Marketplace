"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BUSINESS_STATUSES,
  BUSINESS_STATUS_LABELS,
  COUNTRIES,
  CURRENCIES,
  SECTORS,
  SECTOR_LABELS,
} from "@/lib/domain";

const SORTS = [
  ["newest", "Newest"],
  ["popular", "Most viewed"],
  ["price_asc", "Price ↑"],
  ["price_desc", "Price ↓"],
] as const;

export function AssetFilters({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(sp.get("q") ?? "");

  const current = useMemo(() => new URLSearchParams(sp.toString()), [sp]);
  const sectors = current.getAll("sector");
  const countries = current.getAll("country");
  const statuses = current.getAll("businessStatus");

  function commit(next: URLSearchParams) {
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  function toggleMulti(key: string, value: string) {
    const next = new URLSearchParams(current.toString());
    const has = next.getAll(key).includes(value);
    const kept = next.getAll(key).filter((v) => v !== value);
    next.delete(key);
    for (const v of kept) next.append(key, v);
    if (!has) next.append(key, value);
    commit(next);
  }

  function setSingle(key: string, value: string) {
    const next = new URLSearchParams(current.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    commit(next);
  }

  // Debounced free-text search.
  useEffect(() => {
    const id = setTimeout(() => {
      if ((sp.get("q") ?? "") === q) return;
      const next = new URLSearchParams(current.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      commit(next);
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const activeCount =
    sectors.length + countries.length + statuses.length +
    (current.get("priceMin") ? 1 : 0) + (current.get("priceMax") ? 1 : 0) +
    (current.get("currency") ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`pill ${sectors.length === 0 ? "pill-active" : ""}`}
          onClick={() => {
            const next = new URLSearchParams(current.toString());
            next.delete("sector");
            commit(next);
          }}
        >
          All
        </button>
        {SECTORS.map((s) => (
          <button
            key={s}
            type="button"
            className={`pill ${sectors.includes(s) ? "pill-active" : ""}`}
            onClick={() => toggleMulti("sector", s)}
          >
            {SECTOR_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search title, description, country…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className={`btn-ghost btn-sm ${activeCount ? "border-ink" : ""}`}
          onClick={() => setOpen((v) => !v)}
        >
          Filters{activeCount ? ` (${activeCount})` : ""}
        </button>
        <select
          className="input btn-sm w-auto"
          value={current.get("sort") ?? "newest"}
          onChange={(e) => setSingle("sort", e.target.value)}
        >
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[13px] text-muted">
          {pending ? "Updating…" : `${total} listing${total === 1 ? "" : "s"}`}
        </span>
      </div>

      {open && (
        <div className="card grid gap-5 p-4 sm:grid-cols-3">
          <fieldset>
            <legend className="label">Jurisdiction</legend>
            <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
              {COUNTRIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={countries.includes(c)}
                    onChange={() => toggleMulti("country", c)}
                  />
                  {c}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Business status</legend>
            <div className="space-y-1.5">
              {BUSINESS_STATUSES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={statuses.includes(s)}
                    onChange={() => toggleMulti("businessStatus", s)}
                  />
                  {BUSINESS_STATUS_LABELS[s]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="label">Asking price</legend>
            <select
              className="input"
              value={current.get("currency") ?? ""}
              onChange={(e) => setSingle("currency", e.target.value)}
            >
              <option value="">Any currency</option>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                className="input"
                inputMode="numeric"
                placeholder="Min"
                defaultValue={current.get("priceMin") ?? ""}
                onBlur={(e) => setSingle("priceMin", e.target.value.replace(/\D/g, ""))}
              />
              <input
                className="input"
                inputMode="numeric"
                placeholder="Max"
                defaultValue={current.get("priceMax") ?? ""}
                onBlur={(e) => setSingle("priceMax", e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={current.get("includeOnRequest") === "true"}
                onChange={(e) => setSingle("includeOnRequest", e.target.checked ? "true" : "")}
              />
              Include “on LOI” listings
            </label>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
            >
              Clear all
            </button>
          </fieldset>
        </div>
      )}
    </div>
  );
}
