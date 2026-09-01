import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { AdminAssetControls } from "@/components/admin-asset-controls";
import { ContactForm } from "@/components/contact-form";
import { MatchBadge, MatchReasons } from "@/components/match-badge";
import { Sparkline } from "@/components/sparkline";
import { StatusBadge, ValidatedBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { BUSINESS_STATUS_LABELS, SECTOR_LABELS } from "@/lib/domain";
import { formatMoneyFull } from "@/lib/format";
import { assetLooksComplete, matchAssetForMandate } from "@/lib/match";
import {
  assetIsPubliclyVisible,
  assetOwnedBy,
  getAssetRecordBySlug,
  getMandate,
  incrementAssetViews,
} from "@/lib/repo";
import { serializeAsset } from "@/lib/serialize";

export default async function AssetDetailPage({ params }: PageProps<"/listings/[slug]">) {
  const { slug } = await params;
  const record = await getAssetRecordBySlug(slug);
  if (!record) notFound();

  const user = await getCurrentUser();
  const owner = user ? assetOwnedBy(record, user) : false;
  const publiclyVisible = assetIsPubliclyVisible(record);

  if (!publiclyVisible && !owner) notFound();

  if (publiclyVisible && !owner) {
    after(() => incrementAssetViews(record.id));
  }

  const asset = serializeAsset(record);
  const mandate = user?.role === "buyer" ? await getMandate(user.id) : null;
  const match = matchAssetForMandate(mandate, {
    sector: record.sector,
    country: record.country,
    askingPrice: record.askingPrice,
    businessStatus: record.businessStatus,
    createdAt: record.createdAt,
  });

  const facts: { label: string; value: string }[] = [
    { label: "Country", value: asset.country },
    { label: "Type of licence", value: asset.licenseType || "—" },
    { label: "Sector", value: SECTOR_LABELS[asset.sector] },
    { label: "Business status", value: BUSINESS_STATUS_LABELS[asset.businessStatus] },
    { label: "Regulator", value: asset.regulator || "—" },
    { label: "Year of issue", value: asset.yearIssued ? String(asset.yearIssued) : "—" },
    { label: "Employees", value: asset.employees || "—" },
    { label: "Asking price", value: formatMoneyFull(asset.askingPrice, asset.currency) },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Link href="/listings" className="text-[13px] text-muted hover:text-ink">
          ← All listings
        </Link>

        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="tag">{SECTOR_LABELS[asset.sector]}</span>
              <h1 className="mt-2 text-xl font-semibold leading-tight">{asset.title}</h1>
            </div>
            {asset.status !== "published" ? (
              <StatusBadge status={asset.status} />
            ) : assetLooksComplete(asset) ? (
              <ValidatedBadge />
            ) : null}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="rounded-lg bg-canvas px-3 py-2">
                <dt className="text-[11px] uppercase tracking-wide text-muted">{f.label}</dt>
                <dd className="text-[13px] font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>

          {asset.highlights.length > 0 && (
            <div className="mt-4">
              <p className="label">Included</p>
              <div className="flex flex-wrap gap-1.5">
                {asset.highlights.map((h) => (
                  <span key={h} className="pill">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 border-t border-line pt-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">
                Market trend (indicative)
              </p>
              <Sparkline seed={asset.slug} width={220} height={44} points={10} />
            </div>
            <span className="ml-auto text-[13px] text-muted">{asset.views} views</span>
          </div>
        </div>

        <section className="card p-5">
          <h2 className="text-[15px] font-semibold">Company overview</h2>
          {user ? (
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-muted">
              {asset.description || "The seller has not written an overview yet."}
            </p>
          ) : (
            <div className="mt-2">
              <p className="line-clamp-3 text-[14px] leading-relaxed text-muted">
                {asset.description}
              </p>
              <div className="mt-3 rounded-xl border border-dashed border-line bg-canvas p-4 text-[13px] text-muted">
                <Link
                  href={`/login?next=/listings/${asset.slug}`}
                  className="font-medium text-brand-700"
                >
                  Sign in
                </Link>{" "}
                to see the full overview and contact the seller.
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        {match && (
          <div className="card p-4">
            <MatchBadge match={match} />
            <MatchReasons match={match} />
          </div>
        )}

        {owner && (
          <div className="card space-y-2 p-4">
            <p className="text-[13px] font-medium">
              {user?.role === "manager" ? "Platform view" : "This is your listing"}
            </p>
            <Link href={`/assets/${asset.id}/edit`} className="btn-primary btn-sm w-full">
              Edit listing
            </Link>
          </div>
        )}

        {user?.role === "manager" && (
          <AdminAssetControls assetId={asset.id} status={asset.status} />
        )}

        {user?.role === "buyer" && asset.seller && publiclyVisible && (
          <ContactForm
            toUserId={asset.seller.id}
            assetId={asset.id}
            counterpartLabel={asset.seller.name}
            defaultMessage={`Hi ${asset.seller.name}, I'm interested in "${asset.title}".`}
          />
        )}

        {!user && (
          <Link href={`/login?next=/listings/${asset.slug}`} className="btn-brand w-full">
            Sign in to contact seller
          </Link>
        )}

        {asset.seller && user && (
          <div className="card p-4 text-[13px] text-muted">
            Listed by <span className="font-medium text-ink">{asset.seller.name}</span>
          </div>
        )}
      </aside>
    </div>
  );
}
