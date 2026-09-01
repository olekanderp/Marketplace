import { describe, expect, it } from "vitest";
import {
  matchAsset,
  mandateIsUsable,
  smartValidateAsset,
  type AssetDraft,
  type Mandate,
  type MatchableAsset,
} from "@/lib/match";

const fresh = new Date().toISOString();

const emiAsset: MatchableAsset = {
  sector: "emi",
  country: "Lithuania",
  askingPrice: 4_000_000,
  businessStatus: "active",
  createdAt: fresh,
};

describe("matchAsset", () => {
  it("scores a perfect fit at or near 100", () => {
    const mandate: Mandate = {
      targetSectors: ["emi", "payment"],
      targetJurisdictions: ["Lithuania"],
      ticketMin: 1_000_000,
      ticketMax: 6_000_000,
    };
    const { score, reasons } = matchAsset(mandate, emiAsset);
    expect(score).toBe(100);
    expect(reasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining("target sector"),
        expect.stringContaining("target jurisdiction"),
        expect.stringContaining("ticket range"),
      ]),
    );
  });

  it("penalises a sector mismatch", () => {
    const mandate: Mandate = {
      targetSectors: ["crypto"],
      targetJurisdictions: ["Lithuania"],
      ticketMin: null,
      ticketMax: null,
    };
    expect(matchAsset(mandate, emiAsset).score).toBeLessThan(60);
  });

  it("treats an 'on LOI' price as neutral, not disqualifying", () => {
    const mandate: Mandate = {
      targetSectors: ["emi"],
      targetJurisdictions: [],
      ticketMin: 1,
      ticketMax: 2,
    };
    const withPrice = matchAsset(mandate, { ...emiAsset, askingPrice: 900_000_000 });
    const onLoi = matchAsset(mandate, { ...emiAsset, askingPrice: null });
    expect(onLoi.score).toBeGreaterThan(withPrice.score);
  });

  it("decays with listing age", () => {
    const old = { ...emiAsset, createdAt: new Date(Date.now() - 200 * 86_400_000).toISOString() };
    const mandate: Mandate = { targetSectors: [], targetJurisdictions: [], ticketMin: null, ticketMax: null };
    expect(matchAsset(mandate, emiAsset).score).toBeGreaterThan(matchAsset(mandate, old).score);
  });
});

describe("mandateIsUsable", () => {
  it("is false for an empty mandate", () => {
    expect(
      mandateIsUsable({ targetSectors: [], targetJurisdictions: [], ticketMin: null, ticketMax: null }),
    ).toBe(false);
  });
  it("is true once any facet is set", () => {
    expect(
      mandateIsUsable({ targetSectors: ["bank"], targetJurisdictions: [], ticketMin: null, ticketMax: null }),
    ).toBe(true);
  });
});

describe("smartValidateAsset", () => {
  const base: AssetDraft = {
    description: "x".repeat(200),
    askingPrice: 1_000_000,
    highlights: ["Licensed"],
    sector: "fintech",
    regulator: "FCA",
    yearIssued: 2020,
    licenseType: "API",
  };

  it("returns no warnings for a complete draft", () => {
    expect(smartValidateAsset(base)).toEqual([]);
  });

  it("flags a thin description", () => {
    expect(smartValidateAsset({ ...base, description: "too short" })).toEqual(
      expect.arrayContaining([expect.stringContaining("120 characters")]),
    );
  });

  it("flags a regulated sector with no regulator", () => {
    expect(smartValidateAsset({ ...base, sector: "bank", regulator: null })).toEqual(
      expect.arrayContaining([expect.stringContaining("no regulator")]),
    );
  });
});
