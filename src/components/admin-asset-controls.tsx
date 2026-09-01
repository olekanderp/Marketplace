"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { ASSET_STATUS_LABELS, ASSET_STATUSES, type AssetStatus } from "@/lib/domain";

export function AdminAssetControls({
  assetId,
  status,
}: {
  assetId: string;
  status: AssetStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<AssetStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function set(next: AssetStatus) {
    setBusy(next);
    setError(null);
    try {
      await apiFetch(`/api/admin/assets/${assetId}`, {
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
    <div className="card space-y-2 border-warn-600/30 bg-warn-50 p-3">
      <p className="text-[13px] font-medium text-warn-600">Moderation · current: {ASSET_STATUS_LABELS[status]}</p>
      <div className="flex flex-wrap gap-2">
        {ASSET_STATUSES.filter((s) => s !== status).map((s) => (
          <button
            key={s}
            className="btn-ghost btn-sm"
            disabled={busy !== null}
            onClick={() => set(s)}
          >
            {busy === s ? "…" : ASSET_STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {error && <p className="text-[13px] text-danger-600">{error}</p>}
    </div>
  );
}
