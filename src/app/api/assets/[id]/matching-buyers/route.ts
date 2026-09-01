import { requireApiRole } from "@/lib/auth/session";
import { handle, jsonOk } from "@/lib/http";
import { matchingBuyersForAsset } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const user = await requireApiRole("seller", "manager");
    const result = await matchingBuyersForAsset(id, user);
    return jsonOk(result);
  });
}
