"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

export function ContactForm({
  toUserId,
  assetId,
  counterpartLabel,
  defaultMessage = "",
}: {
  toUserId: string;
  assetId?: string;
  counterpartLabel: string;
  defaultMessage?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(defaultMessage);
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card space-y-3 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        setError(null);
        try {
          const res = await apiFetch<{ conversation: { id: string } }>("/api/conversations", {
            method: "POST",
            body: JSON.stringify({ toUserId, assetId, message }),
          });
          router.refresh();
          router.push(`/inbox/${res.conversation.id}`);
        } catch (err) {
          setError(describeApiError(err));
          setState("idle");
        }
      }}
    >
      <div>
        <span className="label">Message to {counterpartLabel}</span>
        <textarea
          className="input min-h-24"
          required
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Introduce yourself and what you'd like to know…"
        />
      </div>
      {error && <p className="text-[13px] text-danger-600">{error}</p>}
      <button className="btn-brand" disabled={state === "sending" || !message.trim()}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
