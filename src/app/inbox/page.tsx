import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { formatRelative } from "@/lib/format";
import { listConversationsFor } from "@/lib/repo";

export const metadata = { title: "Inbox — N5Deal" };

export default async function InboxPage() {
  const user = await requireUser("/inbox");
  const conversations = await listConversationsFor(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>

      {conversations.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No conversations yet.{" "}
          <Link href="/listings" className="font-medium text-brand-700">
            Browse listings
          </Link>{" "}
          to get started.
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/inbox/${c.id}`}
              className="flex items-center gap-3 p-4 hover:bg-canvas"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-medium">{c.subject}</p>
                  <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[11px] capitalize text-muted">
                    you: {c.role}
                  </span>
                </div>
                <p className="truncate text-[13px] text-muted">
                  {c.counterpart?.name}: {c.messages.at(-1)?.body ?? "—"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[12px] text-muted">{formatRelative(c.lastMessageAt)}</p>
                {c.unread > 0 && (
                  <span className="mt-1 inline-block rounded-full bg-brand-600 px-2 py-0.5 text-[12px] font-semibold text-white">
                    {c.unread} new
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
