/**
 * Lightweight, deterministic recommender ("Smart Match").
 *
 * Given a buyer's mandate and an asset, produce a 0–100 compatibility score
 * with human-readable reasons. No external LLM — the scoring is transparent and
 * unit-tested, which matters more than raw sophistication for a marketplace
 * where users need to trust the ranking.
 */
import type { BusinessStatus, Sector } from "@/lib/domain";
import { SECTOR_LABELS } from "@/lib/domain";

export interface Mandate {
  targetSectors: Sector[];
  targetJurisdictions: string[];
  ticketMin: number | null;
  ticketMax: number | null;
}

export interface MatchableAsset {
  sector: Sector;
  country: string;
  askingPrice: number | null;
  businessStatus: BusinessStatus;
  createdAt: string | Date;
}

export interface MatchResult {
  score: number;
  reasons: string[];
}

const WEIGHTS = { sector: 0.4, jurisdiction: 0.25, ticket: 0.25, freshness: 0.1 };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function sectorScore(m: Mandate, a: MatchableAsset, reasons: string[]): number {
  if (m.targetSectors.length === 0) return 0.5;
  if (m.targetSectors.includes(a.sector)) {
    reasons.push(`Matches your target sector (${SECTOR_LABELS[a.sector]})`);
    return 1;
  }
  return 0.1;
}

function jurisdictionScore(m: Mandate, a: MatchableAsset, reasons: string[]): number {
  if (m.targetJurisdictions.length === 0) return 0.5;
  const hit = m.targetJurisdictions.some(
    (j) => j.toLowerCase() === a.country.toLowerCase(),
  );
  if (hit) {
    reasons.push(`Located in a target jurisdiction (${a.country})`);
    return 1;
  }
  return 0.15;
}

function ticketScore(m: Mandate, a: MatchableAsset, reasons: string[]): number {
  if (a.askingPrice === null) return 0.4; // "on LOI" — unknown, not disqualifying
  const min = m.ticketMin ?? 0;
  const max = m.ticketMax ?? Number.POSITIVE_INFINITY;
  if (m.ticketMin === null && m.ticketMax === null) return 0.5;

  if (a.askingPrice >= min && a.askingPrice <= max) {
    reasons.push("Asking price is within your ticket range");
    return 1;
  }
  // Partial credit if within 30% of the nearest bound.
  const nearest = a.askingPrice < min ? min : max;
  const drift = Math.abs(a.askingPrice - nearest) / Math.max(nearest, 1);
  return drift <= 0.3 ? 0.6 : 0.1;
}

function freshnessScore(a: MatchableAsset): number {
  const ageDays = (Date.now() - new Date(a.createdAt).getTime()) / 86_400_000;
  if (ageDays <= 30) return 1;
  if (ageDays <= 90) return 0.6;
  return 0.25;
}

export function matchAsset(mandate: Mandate, asset: MatchableAsset): MatchResult {
  const reasons: string[] = [];
  const raw =
    WEIGHTS.sector * sectorScore(mandate, asset, reasons) +
    WEIGHTS.jurisdiction * jurisdictionScore(mandate, asset, reasons) +
    WEIGHTS.ticket * ticketScore(mandate, asset, reasons) +
    WEIGHTS.freshness * freshnessScore(asset);

  if (asset.businessStatus !== "active") {
    reasons.push("Note: business is not currently active");
  }

  return { score: Math.round(clamp01(raw) * 100), reasons };
}

/** Is a mandate specific enough to bother ranking by it? */
export function mandateIsUsable(m: Mandate): boolean {
  return (
    m.targetSectors.length > 0 ||
    m.targetJurisdictions.length > 0 ||
    m.ticketMin !== null ||
    m.ticketMax !== null
  );
}

/* ── Smart validation (used on publish) ───────────────────────────────── */

export interface AssetDraft {
  description: string;
  askingPrice: number | null;
  highlights: string[];
  sector: Sector;
  regulator: string | null;
  yearIssued: number | null;
  licenseType: string;
}

export function smartValidateAsset(d: AssetDraft): string[] {
  const warnings: string[] = [];
  const regulated: Sector[] = ["bank", "payment", "emi"];

  if (d.description.trim().length < 120) {
    warnings.push(
      "Description is under 120 characters — listings with detail get far more buyer interest.",
    );
  }
  if (d.highlights.length === 0) {
    warnings.push("No highlights added. List what's included (licences, integrations, clients).");
  }
  if (d.askingPrice === null) {
    warnings.push("No asking price — the listing will show “on LOI”. Consider a guide price.");
  }
  if (regulated.includes(d.sector) && !d.regulator?.trim()) {
    warnings.push(`Sector is “${d.sector}” but no regulator is named — buyers expect this.`);
  }
  if (regulated.includes(d.sector) && !d.licenseType.trim()) {
    warnings.push("No licence type specified for a regulated asset.");
  }
  if (d.yearIssued === null) {
    warnings.push("Year of issue is missing.");
  }
  return warnings;
}
