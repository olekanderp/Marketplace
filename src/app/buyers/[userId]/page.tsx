import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { requireRole } from "@/lib/auth/session";
import { SECTOR_LABELS } from "@/lib/domain";
import { formatPrice } from "@/lib/format";
import { getBuyer } from "@/lib/repo";

export default async function BuyerDetailPage({ params }: PageProps<"/buyers/[userId]">) {
  const { userId } = await params;
  const viewer = await requireRole(["seller", "manager"], `/buyers/${userId}`);
  const buyer = await getBuyer(userId);
  if (!buyer) notFound();

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Link href="/buyers" className="text-[13px] text-muted hover:text-ink">
          ← Browse buyers
        </Link>

        <div className="card p-5">
          <h1 className="text-xl font-semibold">{buyer.user?.name}</h1>
          <p className="mt-1 text-[14px] text-muted">{buyer.headline || "No headline"}</p>

          {buyer.bio && <p className="mt-4 text-[14px] leading-relaxed">{buyer.bio}</p>}

          <div className="mt-4">
            <p className="label">Mandate</p>
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-muted">
              {buyer.mandate || "Not specified."}
            </p>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[13px]">
            <div>
              <dt className="text-muted">Target sectors</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {buyer.targetSectors.length
                  ? buyer.targetSectors.map((s) => (
                      <span key={s} className="tag">
                        {SECTOR_LABELS[s]}
                      </span>
                    ))
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Jurisdictions</dt>
              <dd className="mt-1">{buyer.targetJurisdictions.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Ticket range</dt>
              <dd className="mt-1 font-medium">
                {buyer.ticketMin || buyer.ticketMax
                  ? `${buyer.ticketMin ? formatPrice(buyer.ticketMin, buyer.currency) : "any"} – ${
                      buyer.ticketMax ? formatPrice(buyer.ticketMax, buyer.currency) : "any"
                    }`
                  : "Not specified"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <aside>
        {viewer.role === "seller" ? (
          <ContactForm
            toUserId={buyer.userId}
            counterpartLabel={buyer.user?.name ?? "buyer"}
            defaultMessage={`Hi ${buyer.user?.name ?? ""}, I have an asset that may fit your mandate.`}
          />
        ) : (
          <div className="card p-4 text-[13px] text-muted">
            Managers can review mandates but not contact buyers.
          </div>
        )}
      </aside>
    </div>
  );
}
