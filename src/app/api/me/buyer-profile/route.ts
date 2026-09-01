import { requireApiRole } from "@/lib/auth/session";
import { handle, jsonOk, readJson } from "@/lib/http";
import { getBuyerProfile, upsertBuyerProfile } from "@/lib/repo";
import { buyerProfileSchema } from "@/lib/validation";

export async function GET() {
  return handle(async () => {
    const user = await requireApiRole("buyer");
    return jsonOk({ profile: await getBuyerProfile(user.id) });
  });
}

export async function PUT(request: Request) {
  return handle(async () => {
    const user = await requireApiRole("buyer");
    const input = buyerProfileSchema.parse(await readJson(request));
    return jsonOk({ profile: await upsertBuyerProfile(user.id, input) });
  });
}
