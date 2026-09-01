import { CURRENCY_SYMBOLS, type Currency } from "@/lib/domain";

export function formatPrice(value: number | null, currency: Currency): string {
  if (value === null) return "on LOI";
  const s = CURRENCY_SYMBOLS[currency] ?? "";
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "");
  if (value >= 1_000_000_000) return `${s}${trim(value / 1e9)}B`;
  if (value >= 1_000_000) return `${s}${trim(value / 1e6)}M`;
  if (value >= 1_000) return `${s}${Math.round(value / 1e3)}K`;
  return `${s}${value}`;
}

export function formatMoneyFull(value: number | null, currency: Currency): string {
  if (value === null) return "Price on LOI";
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    value,
  );
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

export function titleCase(s: string): string {
  return s.replace(/(^|[\s-_])(\w)/g, (_, sep, c) => sep + c.toUpperCase()).replace(/[_-]/g, " ");
}
