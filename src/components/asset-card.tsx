import Link from "next/link";
import { SECTOR_LABELS } from "@/lib/domain";
import { formatPrice } from "@/lib/format";
import type { MatchResult } from "@/lib/match";
import type { AssetDTO } from "@/lib/serialize";
import { MatchBadge } from "./match-badge";
import { Sparkline } from "./sparkline";
import { StatusBadge, ValidatedBadge } from "./status-badge";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-canvas px-2.5 py-1.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="truncate text-[13px] font-semibold">{value}</dd>
    </div>
  );
}

export function AssetCard({
  asset,
  match,
  href,
  showStatus = false,
}: {
  asset: AssetDTO;
  match?: MatchResult;
  href?: string;
  showStatus?: boolean;
}) {
  const to = href ?? `/listings/${asset.slug}`;
  return (
    <article className="card flex flex-col p-4 transition-shadow hover:shadow-[0_1px_20px_rgba(11,11,18,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="tag">{SECTOR_LABELS[asset.sector]}</span>
          <h3 className="mt-1.5 text-[15px] font-semibold leading-snug">
            <Link href={to} className="hover:text-brand-700">
              {asset.title}
            </Link>
          </h3>
        </div>
        {showStatus ? <StatusBadge status={asset.status} /> : <ValidatedBadge />}
      </div>

      <dl className="field-grid mt-3">
        <Field label="Country" value={asset.country} />
        <Field label="Licence" value={asset.licenseType || "—"} />
        <Field label="Business" value={asset.businessStatus.replace(/_/g, " ")} />
        <Field label="Asking" value={formatPrice(asset.askingPrice, asset.currency)} />
      </dl>

      {asset.highlights.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {asset.highlights.slice(0, 3).map((h) => (
            <span key={h} className="pill !px-2 !py-0.5 !text-[12px]">
              {h}
            </span>
          ))}
          {asset.highlights.length > 3 && (
            <span className="pill !px-2 !py-0.5 !text-[12px]">+{asset.highlights.length - 3}</span>
          )}
        </div>
      )}

      <p className="mt-3 line-clamp-2 text-[13px] text-muted">{asset.description}</p>

      <div className="mt-4 flex items-end justify-between border-t border-line pt-3">
        <div className="flex items-center gap-3">
          <Sparkline seed={asset.slug} width={96} height={30} />
          <span className="text-[12px] text-muted">{asset.views} views</span>
        </div>
        <div className="flex items-center gap-2">
          {match && <MatchBadge match={match} />}
          <Link href={to} className="btn-brand btn-sm">
            View asset
          </Link>
        </div>
      </div>
    </article>
  );
}
