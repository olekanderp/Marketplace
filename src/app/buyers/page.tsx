import { BuyerCard } from "@/components/buyer-card";
import { BuyerFilters } from "@/components/buyer-filters";
import { Pagination } from "@/components/pagination";
import { requireRole } from "@/lib/auth/session";
import { searchParamsToObject, toURLSearchParams } from "@/lib/query";
import { listBuyers } from "@/lib/repo";
import { buyerQuerySchema } from "@/lib/validation";

export const metadata = { title: "Browse buyers — N5Deal" };

export default async function BuyersPage({ searchParams }: PageProps<"/buyers">) {
  await requireRole(["seller", "manager"], "/buyers");
  const sp = toURLSearchParams(await searchParams);
  const query = buyerQuerySchema.parse(searchParamsToObject(sp, ["sector"]));
  const { items, total, page, pageCount } = await listBuyers(query);

  const makeHref = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(p));
    return `/buyers?${next.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Browse buyers</h1>
        <p className="mt-1 text-[15px] text-muted">
          Registered buyers and their acquisition mandates. Reach out about a relevant asset.
        </p>
      </header>

      <BuyerFilters total={total} />

      {items.length === 0 ? (
        <div className="card p-10 text-center text-muted">No buyers match these filters.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((buyer) => (
            <BuyerCard key={buyer.id} buyer={buyer} />
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </div>
  );
}
