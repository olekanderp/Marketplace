import { getCurrentUser, requireApiUser } from "@/lib/auth/session";
import { handle, jsonOk, notFound, readJson } from "@/lib/http";
import { smartValidateAsset } from "@/lib/match";
import {
  assetIsPubliclyVisible,
  assetOwnedBy,
  deleteAsset,
  getAssetRecordById,
  updateAsset,
} from "@/lib/repo";
import { serializeAsset } from "@/lib/serialize";
import { assetUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const asset = await getAssetRecordById(id);
    if (!asset) throw notFound("Asset not found");

    if (!assetIsPubliclyVisible(asset)) {
      const user = await getCurrentUser();
      if (!user || !assetOwnedBy(asset, user)) throw notFound("Asset not found");
    }
    return jsonOk({ asset: serializeAsset(asset) });
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const user = await requireApiUser();
    const input = assetUpdateSchema.parse(await readJson(request));
    const asset = await updateAsset(id, user, input);
    const warnings = smartValidateAsset({
      description: asset.description,
      askingPrice: asset.askingPrice,
      highlights: asset.highlights,
      sector: asset.sector,
      regulator: asset.regulator,
      yearIssued: asset.yearIssued,
      licenseType: asset.licenseType,
    });
    return jsonOk({ asset, warnings });
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const user = await requireApiUser();
    await deleteAsset(id, user);
    return jsonOk({ ok: true });
  });
}
