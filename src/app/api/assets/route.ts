import type { NextRequest } from "next/server";
import { getCurrentUser, requireApiRole } from "@/lib/auth/session";
import { handle, jsonOk, readJson } from "@/lib/http";
import { smartValidateAsset } from "@/lib/match";
import { searchParamsToObject } from "@/lib/query";
import { createAsset, getMandate, listAssets } from "@/lib/repo";
import { assetCreateSchema, assetQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const query = assetQuerySchema.parse(
      searchParamsToObject(request.nextUrl.searchParams, ["sector", "country", "businessStatus"]),
    );

    const user = await getCurrentUser();
    const mandate = user?.role === "buyer" ? await getMandate(user.id) : null;
    const result = await listAssets(query, { scope: "published", mandate });
    return jsonOk(result);
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireApiRole("seller");
    const input = assetCreateSchema.parse(await readJson(request));
    const asset = await createAsset(user.id, input);
    const warnings = smartValidateAsset({
      description: input.description,
      askingPrice: input.askingPrice,
      highlights: input.highlights,
      sector: input.sector,
      regulator: input.regulator,
      yearIssued: input.yearIssued,
      licenseType: input.licenseType,
    });
    return jsonOk({ asset, warnings }, 201);
  });
}
