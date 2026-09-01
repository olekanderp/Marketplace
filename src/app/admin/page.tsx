import Link from "next/link";
import { AdminAssetControls } from "@/components/admin-asset-controls";
import { AdminUserControls } from "@/components/admin-user-controls";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth/session";
import { SECTOR_LABELS } from "@/lib/domain";
import { formatPrice } from "@/lib/format";
import { adminListUsers, listAssets } from "@/lib/repo";
import { assetQuerySchema } from "@/lib/validation";

export const metadata = { title: "Moderation — N5Deal" };

const TABS = [
  ["assets", "Assets"],
  ["sellers", "Sellers"],
  ["buyers", "Buyers"],
] as const;

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireRole("manager", "/admin");
  const params = await searchParams;
  const tab = (Array.isArray(params.tab) ? params.tab[0] : params.tab) ?? "assets";
  const q = (Array.isArray(params.q) ? params.q[0] : params.q) ?? "";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Moderation</h1>
        <p className="mt-1 text-[15px] text-muted">
          Review participants and listings. Suspending a seller also suspends their live listings.
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
        <form className="ml-auto" action="/admin">
          <input type="hidden" name="tab" value={tab} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search…"
            className="input max-w-[14rem]"
          />
        </form>
      </div>

      {tab === "assets" ? (
        <AdminAssets q={q} />
      ) : (
        <AdminUsers role={tab === "sellers" ? "seller" : "buyer"} q={q} />
      )}
    </div>
  );
}

async function AdminAssets({ q }: { q: string }) {
  const query = assetQuerySchema.parse({ q: q || undefined, perPage: "48", sort: "newest" });
  const { items, total } = await listAssets(query, { scope: "all" });

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted">{total} assets</p>
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/listings/${a.slug}`} className="font-medium hover:text-brand-700">
                  {a.title}
                </Link>
                <StatusBadge status={a.status} />
              </div>
              <p className="text-[13px] text-muted">
                {SECTOR_LABELS[a.sector]} · {a.country} · {formatPrice(a.askingPrice, a.currency)} ·{" "}
                {a.seller?.name}
              </p>
            </div>
            <AdminAssetControls assetId={a.id} status={a.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

async function AdminUsers({ role, q }: { role: "buyer" | "seller"; q: string }) {
  const { items, total } = await adminListUsers({ role, q: q || undefined, page: 1, perPage: 48 });

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted">{total} {role}s</p>
      <div className="space-y-3">
        {items.map((u) => (
          <div key={u.id} className="card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{u.name}</span>
                <StatusBadge status={u.status} />
              </div>
              <p className="text-[13px] text-muted">
                {u.email}
                {role === "seller" && u.assetCount != null && ` · ${u.assetCount} listings`}
                {role === "buyer" && u.buyerProfile?.headline && ` · ${u.buyerProfile.headline}`}
              </p>
            </div>
            <AdminUserControls userId={u.id} status={u.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
