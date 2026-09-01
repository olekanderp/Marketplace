import { requireApiRole, requireApiUser } from "@/lib/auth/session";
import { handle, jsonOk, readJson } from "@/lib/http";
import { listConversationsFor, startConversation } from "@/lib/repo";
import { startConversationSchema } from "@/lib/validation";

export async function GET() {
  return handle(async () => {
    const user = await requireApiUser();
    return jsonOk({ conversations: await listConversationsFor(user.id) });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireApiRole("buyer", "seller");
    const input = startConversationSchema.parse(await readJson(request));
    const { conversation, created } = await startConversation({
      actor: user,
      toUserId: input.toUserId,
      assetId: input.assetId,
      subject: input.subject,
      message: input.message,
    });
    return jsonOk({ conversation }, created ? 201 : 200);
  });
}
