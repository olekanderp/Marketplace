import { requireApiRole } from "@/lib/auth/session";
import { handle, jsonOk } from "@/lib/http";
import { recommendAssetsForBuyer } from "@/lib/repo";

export async function GET() {
  return handle(async () => {
    const user = await requireApiRole("buyer");
    return jsonOk(await recommendAssetsForBuyer(user.id));
  });
}
