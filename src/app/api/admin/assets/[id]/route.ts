import { requireApiRole } from "@/lib/auth/session";
import { handle, jsonOk, readJson } from "@/lib/http";
import { adminSetAssetStatus } from "@/lib/repo";
import { adminAssetUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  return handle(async () => {
    await requireApiRole("manager");
    const { id } = await params;
    const { status } = adminAssetUpdateSchema.parse(await readJson(request));
    return jsonOk({ asset: await adminSetAssetStatus(id, status) });
  });
}
