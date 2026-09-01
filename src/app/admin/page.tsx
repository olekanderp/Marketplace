import Link from "next/link";
import { AdminAssetControls } from "@/components/admin-asset-controls";
import { AdminUserControls } from "@/components/admin-user-controls";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth/session";
import { ASSET_STATUS_LABELS, SECTOR_LABELS } from "@/lib/domain";
import { formatPrice } from "@/lib/format";
import { searchParamsToObject, toURLSearchParams } from "@/lib/query";
import { adminListUsers, listAssets } from "@/lib/repo";
import { assetQuerySchema } from "@/lib/validation";

export const metadata = { title: "Moderation — N5Deal" };

const TABS = [
  ["assets", "Assets"],
  ["sellers", "Sellers"],
  ["buyers", "Buyers"],
] as const;

type Tab = (typeof TABS)[number][0];

const isTab = (v: string): v is Tab => TABS.some(([t]) => t === v);

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireRole("manager", "/admin");

  const sp = toURLSearchParams(await searchParams);
  const rawTab = sp.get("tab") ?? "assets";
  const tab: Tab = isTab(rawTab) ? rawTab : "assets";
  const q = sp.get("q") ?? "";
  const page = Math.max(1, Number(sp.get("page")) || 1);

  const makeHref = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("tab", tab);
    next.set("page", String(p));
    return `/admin?${next.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Moderation</h1>
        <p className="mt-1 text-[15px] text-muted">
          Suspending or removing a participant immediately hides their listings from the
          marketplace, and is reversible — reactivating them brings the listings back.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map(([value, label]) => (
          <Link
            key={value}
            href={`/admin?tab=${value}`}
            className={`pill ${tab === value ? "pill-active" : ""}`}
          >
            {label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2" action="/admin">
          <input type="hidden" name="tab" value={tab} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search…"
            aria-label="Search"
            className="input max-w-[14rem]"
          />
          <button className="btn-ghost btn-sm">Search</button>
        </form>
      </div>

      {tab === "assets" ? (
        <AdminAssets q={q} page={page} makeHref={makeHref} />
      ) : (
        <AdminUsers
          role={tab === "sellers" ? "seller" : "buyer"}
          q={q}
          page={page}
          makeHref={makeHref}
        />
      )}
    </div>
  );
}

async function AdminAssets({
  q,
  page,
  makeHref,
}: {
  q: string;
  page: number;
  makeHref: (p: number) => string;
}) {
  const query = assetQuerySchema.parse(
    searchParamsToObject(
      new URLSearchParams({ q, page: String(page), perPage: "20", sort: "newest" }),
    ),
  );
  const { items, total, pageCount } = await listAssets(query, { scope: "all" });

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted">{total} assets</p>
      {items.map((a) => (
        <div key={a.id} className="card flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/listings/${a.slug}`} className="font-medium hover:text-brand-700">
                {a.title}
              </Link>
              <StatusBadge status={a.status} label={ASSET_STATUS_LABELS[a.status]} />
            </div>
            <p className="text-[13px] text-muted">
              {SECTOR_LABELS[a.sector]} · {a.country} · {formatPrice(a.askingPrice, a.currency)} ·{" "}
              {a.seller?.name ?? "unknown seller"}
            </p>
          </div>
          <AdminAssetControls assetId={a.id} status={a.status} />
        </div>
      ))}
      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </div>
  );
}

async function AdminUsers({
  role,
  q,
  page,
  makeHref,
}: {
  role: "buyer" | "seller";
  q: string;
  page: number;
  makeHref: (p: number) => string;
}) {
  const { items, total, pageCount } = await adminListUsers({
    role,
    q: q || undefined,
    page,
    perPage: 20,
  });

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted">
        {total} {role}s
      </p>
      {items.map((u) => (
        <div key={u.id} className="card flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{u.name}</span>
              <StatusBadge status={u.status} />
            </div>
            <p className="text-[13px] text-muted">
              {u.email}
              {role === "seller" && u.assetCount !== null && ` · ${u.assetCount} listings`}
              {role === "buyer" && u.buyerProfile?.headline && ` · ${u.buyerProfile.headline}`}
            </p>
          </div>
          <AdminUserControls userId={u.id} status={u.status} />
        </div>
      ))}
      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </div>
  );
}
