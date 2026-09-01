import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssetForm } from "@/components/asset-form";
import { requireUser } from "@/lib/auth/session";
import { assetOwnedBy, getAssetRecordById } from "@/lib/repo";
import { serializeAsset } from "@/lib/serialize";

export default async function EditAssetPage({ params }: PageProps<"/assets/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser(`/assets/${id}/edit`);
  const record = await getAssetRecordById(id);
  if (!record) notFound();
  if (!assetOwnedBy(record, user)) redirect("/dashboard");

  const asset = serializeAsset(record);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/listings/${asset.slug}`} className="text-[13px] text-muted hover:text-ink">
        ← View listing
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Edit listing</h1>
      <AssetForm
        mode="edit"
        assetId={asset.id}
        initial={{
          title: asset.title,
          description: asset.description,
          sector: asset.sector,
          licenseType: asset.licenseType,
          country: asset.country,
          businessStatus: asset.businessStatus,
          askingPrice: asset.askingPrice,
          currency: asset.currency,
          yearIssued: asset.yearIssued,
          employees: asset.employees,
          regulator: asset.regulator,
          highlights: asset.highlights,
          status: asset.status === "published" ? "published" : "draft",
        }}
      />
    </div>
  );
}
