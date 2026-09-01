import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageComposer } from "@/components/message-composer";
import { requireUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/http";
import { formatRelative } from "@/lib/format";
import { getConversationFor, markConversationRead } from "@/lib/repo";

export default async function ConversationPage({ params }: PageProps<"/inbox/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/inbox/${id}`);

  let conversation;
  try {
    await markConversationRead(id, user.id);
    conversation = await getConversationFor(id, user.id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/inbox" className="text-[13px] text-muted hover:text-ink">
        ← Inbox
      </Link>

      <header className="card p-4">
        <h1 className="text-lg font-semibold">{conversation.subject}</h1>
        <p className="mt-1 text-[13px] text-muted">
          With {conversation.counterpart?.name} ({conversation.counterpart?.role}) ·{" "}
          {conversation.counterpart?.email}
          {conversation.asset && (
            <>
              {" · "}
              <Link href={`/listings/${conversation.asset.slug}`} className="text-brand-700">
                {conversation.asset.title}
              </Link>
            </>
          )}
        </p>
      </header>

      <div className="space-y-2">
        {conversation.messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[14px] ${
                  mine ? "bg-ink text-white" : "card"
                }`}
              >
                <p className="whitespace-pre-line">{m.body}</p>
                <p className={`mt-1 text-[11px] ${mine ? "text-white/60" : "text-muted"}`}>
                  {m.sender?.name ?? "You"} · {formatRelative(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <MessageComposer conversationId={conversation.id} />
    </div>
  );
}
