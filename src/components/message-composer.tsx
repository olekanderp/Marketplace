"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setBusy(true);
        setError(null);
        try {
          await apiFetch(`/api/conversations/${conversationId}/messages`, {
            method: "POST",
            body: JSON.stringify({ body }),
          });
          setBody("");
          router.refresh();
        } catch (err) {
          setError(describeApiError(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <textarea
        className="input min-h-12"
        rows={2}
        placeholder="Write a reply…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
      />
      <button className="btn-brand" disabled={busy || !body.trim()}>
        {busy ? "…" : "Send"}
      </button>
      {error && <p className="text-[13px] text-danger-600">{error}</p>}
    </form>
  );
}
