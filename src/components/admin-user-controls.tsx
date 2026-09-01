"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { USER_STATUSES, type UserStatus } from "@/lib/domain";

export function AdminUserControls({
  userId,
  status,
}: {
  userId: string;
  status: UserStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<UserStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function set(next: UserStatus) {
    setBusy(next);
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {USER_STATUSES.filter((s) => s !== status).map((s) => (
        <button
          key={s}
          className="btn-ghost btn-sm"
          disabled={busy !== null}
          onClick={() => set(s)}
        >
          {busy === s ? "…" : s === "active" ? "Reactivate" : s === "suspended" ? "Suspend" : "Remove"}
        </button>
      ))}
      {error && <span className="text-[12px] text-danger-600">{error}</span>}
    </div>
  );
}
