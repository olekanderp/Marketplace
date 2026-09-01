import { describe, expect, it } from "vitest";
import {
  matchAsset,
  matchAssetForMandate,
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

const emptyMandate: Mandate = {
  targetSectors: [],
  targetJurisdictions: [],
  ticketMin: null,
  ticketMax: null,
};

describe("matchAsset", () => {
  it("scores a perfect fit at 100", () => {
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

  it("ignores case and padding when comparing jurisdictions", () => {
    const mandate: Mandate = {
      targetSectors: [],
      targetJurisdictions: ["  lithuania "],
      ticketMin: null,
      ticketMax: null,
    };
    expect(matchAsset(mandate, emiAsset).reasons).toEqual(
      expect.arrayContaining([expect.stringContaining("target jurisdiction")]),
    );
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

  it("flags an unverifiable ticket fit as a caveat, not a reason", () => {
    const mandate: Mandate = {
      targetSectors: ["emi"],
      targetJurisdictions: [],
      ticketMin: 1_000_000,
      ticketMax: null,
    };
    const { reasons, caveats } = matchAsset(mandate, { ...emiAsset, askingPrice: null });
    expect(caveats).toEqual(expect.arrayContaining([expect.stringContaining("on LOI")]));
    expect(reasons).not.toEqual(expect.arrayContaining([expect.stringContaining("ticket")]));
  });

  it("reports a non-active business as a caveat", () => {
    const { caveats } = matchAsset(emptyMandate, { ...emiAsset, businessStatus: "dormant" });
    expect(caveats).toEqual(expect.arrayContaining([expect.stringContaining("not currently active")]));
  });

  it("never returns NaN when only a lower ticket bound is set", () => {
    const mandate: Mandate = {
      targetSectors: [],
      targetJurisdictions: [],
      ticketMin: 10_000_000,
      ticketMax: null,
    };
    const { score } = matchAsset(mandate, { ...emiAsset, askingPrice: 1_000 });
    expect(Number.isFinite(score)).toBe(true);
  });

  it("decays with listing age", () => {
    const old = { ...emiAsset, createdAt: new Date(Date.now() - 200 * 86_400_000).toISOString() };
    expect(matchAsset(emptyMandate, emiAsset).score).toBeGreaterThan(
      matchAsset(emptyMandate, old).score,
    );
  });
});

describe("mandateIsUsable", () => {
  it("is false for an empty mandate", () => {
    expect(mandateIsUsable(emptyMandate)).toBe(false);
  });

  it("is true once any facet is set", () => {
    expect(mandateIsUsable({ ...emptyMandate, targetSectors: ["bank"] })).toBe(true);
    expect(mandateIsUsable({ ...emptyMandate, ticketMax: 1 })).toBe(true);
  });
});

describe("matchAssetForMandate", () => {
  it("returns null rather than a misleading score for an empty mandate", () => {
    expect(matchAssetForMandate(emptyMandate, emiAsset)).toBeNull();
    expect(matchAssetForMandate(null, emiAsset)).toBeNull();
  });

  it("scores when the mandate has at least one facet", () => {
    const result = matchAssetForMandate({ ...emptyMandate, targetSectors: ["emi"] }, emiAsset);
    expect(result?.score).toBeGreaterThan(0);
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

  it("does not demand a regulator for unregulated sectors", () => {
    expect(smartValidateAsset({ ...base, sector: "crypto", regulator: null })).toEqual([]);
  });
});
