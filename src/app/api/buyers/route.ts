import type { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/auth/session";
import { handle, jsonOk } from "@/lib/http";
import { searchParamsToObject } from "@/lib/query";
import { listBuyers } from "@/lib/repo";
import { buyerQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireApiRole("seller", "manager");
    const query = buyerQuerySchema.parse(
      searchParamsToObject(request.nextUrl.searchParams, ["sector"]),
    );
    return jsonOk(await listBuyers(query));
  });
}
