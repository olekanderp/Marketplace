import { describe, expect, it } from "vitest";
import {
  assetCreateSchema,
  assetQuerySchema,
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
      highlights: [],
      businessStatus: "active",
    });
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
    expect(parsed.askingPrice).toBe(250000);
  });
});

describe("assetQuerySchema", () => {
  it("coerces pagination and defaults the sort", () => {
    const parsed = assetQuerySchema.parse({ page: "2", perPage: "6" });
    expect(parsed).toMatchObject({ page: 2, perPage: 6, sort: "newest" });
  });

  it("keeps repeated sector values as an array", () => {
    const parsed = assetQuerySchema.parse({ sector: ["emi", "payment"] });
    expect(parsed.sector).toEqual(["emi", "payment"]);
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
