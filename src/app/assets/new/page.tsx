import { requireRole } from "@/lib/auth/session";
import { AssetForm, EMPTY_ASSET } from "@/components/asset-form";

export const metadata = { title: "Publish an asset — N5Deal" };

export default async function NewAssetPage() {
  await requireRole("seller", "/assets/new");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Publish an asset</h1>
        <p className="mt-1 text-[15px] text-muted">
          Save a draft first — you can publish once the listing is complete.
        </p>
      </header>
      <AssetForm mode="create" initial={EMPTY_ASSET} />
    </div>
  );
}
