import { requireApiRole } from "@/lib/auth/session";
import { handle, jsonOk, notFound } from "@/lib/http";
import { getBuyer } from "@/lib/repo";

type Ctx = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    await requireApiRole("seller", "manager");
    const { userId } = await params;
    const buyer = await getBuyer(userId);
    if (!buyer) throw notFound("Buyer not found");
    return jsonOk({ buyer });
  });
}
