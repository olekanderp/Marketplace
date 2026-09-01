import { requireApiRole } from "@/lib/auth/session";
import { handle, jsonOk, readJson } from "@/lib/http";
import { getSellerProfile, upsertSellerProfile } from "@/lib/repo";
import { sellerProfileSchema } from "@/lib/validation";

export async function GET() {
  return handle(async () => {
    const user = await requireApiRole("seller");
    return jsonOk({ profile: await getSellerProfile(user.id) });
  });
}

export async function PUT(request: Request) {
  return handle(async () => {
    const user = await requireApiRole("seller");
    const input = sellerProfileSchema.parse(await readJson(request));
    return jsonOk({ profile: await upsertSellerProfile(user.id, input) });
  });
}
