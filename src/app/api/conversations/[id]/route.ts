import { requireApiUser } from "@/lib/auth/session";
import { handle, jsonOk } from "@/lib/http";
import { getConversationFor, markConversationRead } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    await markConversationRead(id, user.id);
    return jsonOk({ conversation: await getConversationFor(id, user.id) });
  });
}
