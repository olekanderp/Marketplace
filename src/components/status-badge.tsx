import { BUSINESS_STATUS_LABELS, type AssetStatus, type BusinessStatus, type UserStatus } from "@/lib/domain";

const MAP: Record<string, string> = {
  active: "bg-positive-50 text-positive-700",
  published: "bg-positive-50 text-positive-700",
  dormant: "bg-warn-50 text-warn-600",
  in_development: "bg-brand-50 text-brand-700",
  draft: "bg-canvas text-muted",
  suspended: "bg-danger-50 text-danger-600",
  removed: "bg-danger-50 text-danger-600",
  archived: "bg-canvas text-muted",
};

export function StatusBadge({
  status,
  label,
}: {
  status: AssetStatus | BusinessStatus | UserStatus;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize ${
        MAP[status] ?? "bg-canvas text-muted"
      }`}
    >
      {label ?? BUSINESS_STATUS_LABELS[status as BusinessStatus] ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function ValidatedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-positive-700">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5z" />
      </svg>
      Validated
    </span>
  );
}
