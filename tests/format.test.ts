import { describe, expect, it } from "vitest";
import { parseDigits, safeNextPath } from "@/lib/format";

describe("parseDigits", () => {
  it("returns null for blank or non-numeric input instead of zero", () => {
    expect(parseDigits("")).toBeNull();
    expect(parseDigits("abc")).toBeNull();
    expect(parseDigits("  ")).toBeNull();
  });

  it("keeps a plain integer", () => {
    expect(parseDigits("250000")).toBe(250_000);
  });

  it("strips formatting characters", () => {
    expect(parseDigits("1,500,000")).toBe(1_500_000);
  });
});

describe("safeNextPath", () => {
  it("accepts same-origin paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/admin?tab=sellers")).toBe("/admin?tab=sellers");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath("/foo://bar")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
  });
});
