import type { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/auth/session";
import { isRole, USER_STATUSES, type Role, type UserStatus } from "@/lib/domain";
import { handle, jsonOk } from "@/lib/http";
import { adminListUsers } from "@/lib/repo";

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireApiRole("manager");
    const sp = request.nextUrl.searchParams;
    const roleParam = sp.get("role");
    const statusParam = sp.get("status");
    return jsonOk(
      await adminListUsers({
        role: isRole(roleParam) ? (roleParam as Role) : undefined,
        status: (USER_STATUSES as readonly string[]).includes(statusParam ?? "")
          ? (statusParam as UserStatus)
          : undefined,
        q: sp.get("q")?.trim() || undefined,
        page: Math.max(1, Number(sp.get("page")) || 1),
        perPage: Math.min(48, Math.max(1, Number(sp.get("perPage")) || 20)),
      }),
    );
  });
}
