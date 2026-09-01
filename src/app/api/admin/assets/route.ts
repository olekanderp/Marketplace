import type { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/auth/session";
import { handle, jsonOk } from "@/lib/http";
import { searchParamsToObject } from "@/lib/query";
import { listAssets } from "@/lib/repo";
import { assetQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireApiRole("manager");
    const query = assetQuerySchema.parse(
      searchParamsToObject(request.nextUrl.searchParams, ["sector", "country", "businessStatus"]),
    );
    return jsonOk(await listAssets(query, { scope: "all" }));
  });
}
