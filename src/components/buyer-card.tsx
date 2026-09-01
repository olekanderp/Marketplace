import Link from "next/link";
import { SECTOR_LABELS } from "@/lib/domain";
import { formatPrice } from "@/lib/format";
import type { MatchResult } from "@/lib/match";
import type { BuyerProfileDTO } from "@/lib/serialize";
import { MatchBadge } from "./match-badge";

export function BuyerCard({ buyer, match }: { buyer: BuyerProfileDTO; match?: MatchResult }) {
  const ticket =
    buyer.ticketMin || buyer.ticketMax
      ? `${buyer.ticketMin ? formatPrice(buyer.ticketMin, buyer.currency) : "any"} – ${
          buyer.ticketMax ? formatPrice(buyer.ticketMax, buyer.currency) : "any"
        }`
      : "Ticket not specified";

  return (
    <article className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">{buyer.user?.name ?? "Buyer"}</h3>
          <p className="mt-0.5 text-[13px] text-muted">{buyer.headline || "No headline yet"}</p>
        </div>
        {match && <MatchBadge match={match} />}
      </div>

      {buyer.mandate && (
        <p className="mt-2 line-clamp-3 text-[13px] text-muted">{buyer.mandate}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {buyer.targetSectors.map((s) => (
          <span key={s} className="tag">
            {SECTOR_LABELS[s]}
          </span>
        ))}
        {buyer.targetJurisdictions.slice(0, 4).map((j) => (
          <span key={j} className="pill !px-2 !py-0.5 !text-[12px]">
            {j}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[13px] text-muted">
        <span>{ticket}</span>
        <Link href={`/buyers/${buyer.userId}`} className="btn-ghost btn-sm">
          View & contact
        </Link>
      </div>
    </article>
  );
}
