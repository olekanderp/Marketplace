import { describe, expect, it } from "vitest";
import {
  assetCreateSchema,
  assetQuerySchema,
  assetUpdateSchema,
  buyerProfileSchema,
  registerSchema,
  startConversationSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts a valid buyer registration and normalises the email", () => {
    const parsed = registerSchema.parse({
      name: "  Finn ",
      email: "FINN@Example.com ",
      password: "longenough",
      role: "buyer",
    });
    expect(parsed.email).toBe("finn@example.com");
    expect(parsed.name).toBe("Finn");
  });

  it("rejects a short password", () => {
    expect(() =>
      registerSchema.parse({ name: "Ok", email: "a@b.co", password: "short", role: "buyer" }),
    ).toThrow();
  });

  it("does not allow registering as manager", () => {
    expect(() =>
      registerSchema.parse({ name: "Ok", email: "a@b.co", password: "longenough", role: "manager" }),
    ).toThrow();
  });
});

describe("assetCreateSchema", () => {
  it("applies defaults for optional fields", () => {
    const parsed = assetCreateSchema.parse({
      title: "Lithuania EMI licence",
      sector: "emi",
      country: "Lithuania",
    });
    expect(parsed).toMatchObject({
      status: "draft",
      currency: "USD",
      askingPrice: null,
      yearIssued: null,
      highlights: [],
      businessStatus: "active",
    });
  });

  it("treats an empty price as 'on LOI', not zero", () => {
    const parsed = assetCreateSchema.parse({
      title: "No price yet",
      sector: "emi",
      country: "Malta",
      askingPrice: "",
      yearIssued: "",
    });
    expect(parsed.askingPrice).toBeNull();
    expect(parsed.yearIssued).toBeNull();
  });

  it("rejects an unknown sector", () => {
    expect(() =>
      assetCreateSchema.parse({ title: "Test title", sector: "banana", country: "Nowhere" }),
    ).toThrow();
  });

  it("coerces a numeric asking price from a string", () => {
    const parsed = assetCreateSchema.parse({
      title: "Priced asset",
      sector: "payment",
      country: "Poland",
      askingPrice: "250000",
    });
    expect(parsed.askingPrice).toBe(250_000);
  });

  it("does not let a seller set a platform-only status", () => {
    expect(() =>
      assetCreateSchema.parse({
        title: "Sneaky listing",
        sector: "emi",
        country: "Malta",
        status: "suspended",
      }),
    ).toThrow();
    expect(() => assetUpdateSchema.parse({ status: "suspended" })).toThrow();
    expect(assetUpdateSchema.parse({ status: "archived" }).status).toBe("archived");
  });
});

describe("buyerProfileSchema", () => {
  it("rejects a ticket range where the minimum exceeds the maximum", () => {
    expect(() => buyerProfileSchema.parse({ ticketMin: 5_000_000, ticketMax: 1_000_000 })).toThrow();
  });

  it("accepts open-ended ticket ranges", () => {
    expect(buyerProfileSchema.parse({ ticketMin: 1_000_000 }).ticketMax).toBeNull();
    expect(buyerProfileSchema.parse({ ticketMax: 1_000_000 }).ticketMin).toBeNull();
  });
});

describe("assetQuerySchema", () => {
  it("coerces pagination and defaults the sort", () => {
    const parsed = assetQuerySchema.parse({ page: "2", perPage: "6" });
    expect(parsed).toMatchObject({ page: 2, perPage: 6, sort: "newest" });
  });

  it("keeps repeated sector values as an array", () => {
    expect(assetQuerySchema.parse({ sector: ["emi", "payment"] }).sector).toEqual([
      "emi",
      "payment",
    ]);
  });

  it("ignores an empty price bound instead of filtering on zero", () => {
    const parsed = assetQuerySchema.parse({ priceMin: "", priceMax: "" });
    expect(parsed.priceMin).toBeUndefined();
    expect(parsed.priceMax).toBeUndefined();
  });

  it("parses includeOnRequest as a real boolean", () => {
    expect(assetQuerySchema.parse({ includeOnRequest: "false" }).includeOnRequest).toBe(false);
    expect(assetQuerySchema.parse({ includeOnRequest: "true" }).includeOnRequest).toBe(true);
  });

  it("caps perPage", () => {
    expect(() => assetQuerySchema.parse({ perPage: "500" })).toThrow();
  });
});

describe("startConversationSchema", () => {
  it("requires a non-empty message and a valid recipient id", () => {
    expect(() => startConversationSchema.parse({ toUserId: "not-a-uuid", message: "hi" })).toThrow();
    expect(() =>
      startConversationSchema.parse({
        toUserId: "00000000-0000-4000-8000-000000000010",
        message: "  ",
      }),
    ).toThrow();
  });
});
