"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SECTORS, SECTOR_LABELS } from "@/lib/domain";

export function BuyerFilters({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [jur, setJur] = useState(sp.get("jurisdiction") ?? "");
  const sectors = sp.getAll("sector");

  function push(next: URLSearchParams) {
    next.delete("page");
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  function toggleSector(s: string) {
    const next = new URLSearchParams(sp.toString());
    const kept = next.getAll("sector").filter((v) => v !== s);
    const had = next.getAll("sector").includes(s);
    next.delete("sector");
    for (const v of kept) next.append("sector", v);
    if (!had) next.append("sector", s);
    push(next);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if ((sp.get("q") ?? "") === q && (sp.get("jurisdiction") ?? "") === jur) return;
      const next = new URLSearchParams(sp.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      if (jur) next.set("jurisdiction", jur);
      else next.delete("jurisdiction");
      push(next);
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, jur]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SECTORS.map((s) => (
          <button
            key={s}
            type="button"
            className={`pill ${sectors.includes(s) ? "pill-active" : ""}`}
            onClick={() => toggleSector(s)}
          >
            {SECTOR_LABELS[s]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" placeholder="Search mandate…" value={q} onChange={(e) => setQ(e.target.value)} />
        <input className="input max-w-[12rem]" placeholder="Jurisdiction" value={jur} onChange={(e) => setJur(e.target.value)} />
        <span className="ml-auto text-[13px] text-muted">
          {pending ? "Updating…" : `${total} buyer${total === 1 ? "" : "s"}`}
        </span>
      </div>
    </div>
  );
}
