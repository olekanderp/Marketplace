import { getCurrentUser } from "@/lib/auth/session";
import { handle, jsonOk } from "@/lib/http";
import { getBuyerProfile, getSellerProfile } from "@/lib/repo";
import { serializeUserSelf } from "@/lib/serialize";

export async function GET() {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return jsonOk({ user: null });

    const profile =
      user.role === "buyer"
        ? await getBuyerProfile(user.id)
        : user.role === "seller"
          ? await getSellerProfile(user.id)
          : null;

    return jsonOk({ user: serializeUserSelf(user), profile });
  });
}
