"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

interface Values {
  companyName: string;
  about: string;
  website: string;
}

export function SellerProfileForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card space-y-5 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("saving");
        setError(null);
        try {
          await apiFetch("/api/me/seller-profile", {
            method: "PUT",
            body: JSON.stringify(v),
          });
          setState("saved");
          router.refresh();
        } catch (err) {
          setError(describeApiError(err));
          setState("idle");
        }
      }}
    >
      <div>
        <label className="label" htmlFor="companyName">
          Company name
        </label>
        <input
          id="companyName"
          className="input"
          maxLength={160}
          value={v.companyName}
          onChange={(e) => setV({ ...v, companyName: e.target.value })}
        />
      </div>

      <div>
        <label className="label" htmlFor="about">
          About
        </label>
        <textarea
          id="about"
          className="input min-h-28"
          placeholder="What kind of assets do you sell, and what is your track record?"
          value={v.about}
          onChange={(e) => setV({ ...v, about: e.target.value })}
        />
      </div>

      <div>
        <label className="label" htmlFor="website">
          Website
        </label>
        <input
          id="website"
          className="input"
          placeholder="https://example.com"
          value={v.website}
          onChange={(e) => setV({ ...v, website: e.target.value })}
        />
      </div>

      {error && <p className="text-[13px] text-danger-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Save profile"}
        </button>
        {state === "saved" && <span className="text-[13px] text-positive-700">Saved ✓</span>}
      </div>
    </form>
  );
}
