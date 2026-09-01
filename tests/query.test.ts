import { describe, expect, it } from "vitest";
import { searchParamsToObject, toURLSearchParams } from "@/lib/query";

describe("searchParamsToObject", () => {
  it("collects repeated keys into arrays", () => {
    const sp = new URLSearchParams("sector=emi&sector=payment&q=lithuania");
    expect(searchParamsToObject(sp, ["sector"])).toEqual({
      sector: ["emi", "payment"],
      q: "lithuania",
    });
  });

  it("drops empty values so they never coerce to zero", () => {
    const sp = new URLSearchParams("priceMin=&priceMax=&q=");
    expect(searchParamsToObject(sp)).toEqual({});
  });

  it("drops empty entries inside array keys", () => {
    const sp = new URLSearchParams("country=&country=Brazil");
    expect(searchParamsToObject(sp, ["country"])).toEqual({ country: ["Brazil"] });
  });
});

describe("toURLSearchParams", () => {
  it("expands arrays into repeated keys and skips blanks", () => {
    const sp = toURLSearchParams({ sector: ["emi", ""], q: "", page: "2" });
    expect(sp.getAll("sector")).toEqual(["emi"]);
    expect(sp.has("q")).toBe(false);
    expect(sp.get("page")).toBe("2");
  });
});
