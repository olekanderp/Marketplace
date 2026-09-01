import { AssetCard } from "@/components/asset-card";
import { AssetFilters } from "@/components/asset-filters";
import { Pagination } from "@/components/pagination";
import { getCurrentUser } from "@/lib/auth/session";
import { getMandate, listAssetCountries, listAssets } from "@/lib/repo";
import { searchParamsToObject, toURLSearchParams } from "@/lib/query";
import { assetQuerySchema } from "@/lib/validation";

export const metadata = { title: "All listings — N5Deal" };

const ARRAY_KEYS = ["sector", "country", "businessStatus"] as const;

export default async function ListingsPage({ searchParams }: PageProps<"/listings">) {
  const sp = toURLSearchParams(await searchParams);
  const query = assetQuerySchema.parse(searchParamsToObject(sp, ARRAY_KEYS));

  const user = await getCurrentUser();
  const mandate = user?.role === "buyer" ? await getMandate(user.id) : null;

  const [{ items, total, page, pageCount }, countries] = await Promise.all([
    listAssets(query, { scope: "published", mandate }),
    listAssetCountries(),
  ]);

  const makeHref = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(p));
    return `/listings?${next.toString()}`;
  };

  const ranked = items.some((i) => i.match);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Browse assets</h1>
        <p className="text-[15px] text-muted">
          Licensed banking, payment, EMI, crypto and fintech businesses for acquisition.
          {ranked && " Scored against your mandate."}
        </p>
      </header>

      <AssetFilters total={total} countries={countries} />

      {items.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No listings match these filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((asset) => (
            <AssetCard key={asset.id} asset={asset} match={asset.match} />
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </div>
  );
}
