import { requireApiRole } from "@/lib/auth/session";
import { handle, jsonOk, readJson } from "@/lib/http";
import { adminSetUserStatus } from "@/lib/repo";
import { adminUserUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  return handle(async () => {
    await requireApiRole("manager");
    const { id } = await params;
    const { status } = adminUserUpdateSchema.parse(await readJson(request));
    return jsonOk({ user: await adminSetUserStatus(id, status) });
  });
}
