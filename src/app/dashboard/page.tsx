import Link from "next/link";
import { redirect } from "next/navigation";
import { AssetCard } from "@/components/asset-card";
import { BuyerCard } from "@/components/buyer-card";
import { requireUser } from "@/lib/auth/session";
import {
  listConversationsFor,
  listSellerAssets,
  matchingBuyersForAsset,
  recommendAssetsForBuyer,
} from "@/lib/repo";

export const metadata = { title: "Dashboard — N5Deal" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  if (user.role === "manager") redirect("/admin");

  const conversations = await listConversationsFor(user.id);

  if (user.role === "seller") {
    const assets = await listSellerAssets(user.id);
    const newestPublished = assets.find((a) => a.status === "published");
    const buyerMatches = newestPublished
      ? await matchingBuyersForAsset(newestPublished.id, user)
      : null;

    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My listings</h1>
            <p className="mt-1 text-[15px] text-muted">{assets.length} total</p>
          </div>
          <Link href="/assets/new" className="btn-primary">
            Publish an asset
          </Link>
        </header>

        {assets.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            You have no listings yet.{" "}
            <Link href="/assets/new" className="font-medium text-brand-700">
              Create your first
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} href={`/assets/${a.id}/edit`} showStatus />
            ))}
          </div>
        )}

        {buyerMatches && buyerMatches.items.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              Buyers matching “{newestPublished!.title}”
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {buyerMatches.items.slice(0, 4).map(({ buyer, match }) => (
                <BuyerCard key={buyer.id} buyer={buyer} match={match} />
              ))}
            </div>
          </section>
        )}

        <InboxPreview conversations={conversations} />
      </div>
    );
  }

  const recs = await recommendAssetsForBuyer(user.id, 4);
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name}</h1>
        <p className="mt-1 text-[15px] text-muted">
          {recs.mandateUsable
            ? "Listings picked for your mandate."
            : "Add a mandate to get personalised recommendations."}
        </p>
      </header>

      {!recs.mandateUsable && (
        <Link href="/profile" className="btn-brand">
          Set up your mandate
        </Link>
      )}

      {recs.items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recommended for you</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recs.items.map(({ asset, match }) => (
              <AssetCard key={asset.id} asset={asset} match={match} />
            ))}
          </div>
          <Link href="/listings" className="inline-block text-[14px] font-medium text-brand-700">
            Browse all listings →
          </Link>
        </section>
      )}

      <InboxPreview conversations={conversations} />
    </div>
  );
}

function InboxPreview({
  conversations,
}: {
  conversations: Awaited<ReturnType<typeof listConversationsFor>>;
}) {
  if (conversations.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Recent conversations</h2>
      <div className="card divide-y divide-line">
        {conversations.slice(0, 4).map((c) => (
          <Link
            key={c.id}
            href={`/inbox/${c.id}`}
            className="flex items-center justify-between gap-3 p-3.5 hover:bg-canvas"
          >
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">{c.subject}</p>
              <p className="truncate text-[13px] text-muted">
                {c.counterpart?.name} · {c.lastMessage ?? "No messages"}
              </p>
            </div>
            {c.unread > 0 && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[12px] font-semibold text-white">
                {c.unread}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
