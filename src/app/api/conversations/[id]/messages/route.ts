import { requireApiUser } from "@/lib/auth/session";
import { handle, jsonOk, readJson } from "@/lib/http";
import { postMessage } from "@/lib/repo";
import { messageSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    const input = messageSchema.parse(await readJson(request));
    const message = await postMessage(id, user.id, input.body);
    return jsonOk({ message }, 201);
  });
}
