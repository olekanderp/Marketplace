import { endSession } from "@/lib/auth/session";
import { handle, jsonOk } from "@/lib/http";

export async function POST() {
  return handle(async () => {
    await endSession();
    return jsonOk({ ok: true });
  });
}
