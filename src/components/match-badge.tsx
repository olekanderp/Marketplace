import type { MatchResult } from "@/lib/match";

export function MatchBadge({ match, className = "" }: { match: MatchResult; className?: string }) {
  const tone =
    match.score >= 75
      ? "bg-positive-50 text-positive-700"
      : match.score >= 45
        ? "bg-brand-50 text-brand-700"
        : "bg-canvas text-muted";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${tone} ${className}`}
      title={match.reasons.join(" · ") || "Based on your mandate"}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 21.4l1.4-6.8L2.2 9.9l6.9-.8z" />
      </svg>
      Smart match {match.score}%
    </span>
  );
}

export function MatchReasons({ match }: { match: MatchResult }) {
  if (!match.reasons.length) return null;
  return (
    <ul className="mt-2 space-y-1 text-[13px] text-muted">
      {match.reasons.map((r) => (
        <li key={r} className="flex gap-1.5">
          <span className="text-positive-600">✓</span>
          {r}
        </li>
      ))}
    </ul>
  );
}
