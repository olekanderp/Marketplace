import { describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "@/lib/auth/jwt";

describe("access tokens", () => {
  const claims = { userId: "u-123", role: "buyer" as const, email: "a@b.test" };

  it("round-trips a signed token", async () => {
    const token = await signAccessToken(claims);
    expect(token.split(".")).toHaveLength(3);
    await expect(verifyAccessToken(token)).resolves.toEqual(claims);
  });

  it("rejects a tampered token", async () => {
    const token = await signAccessToken(claims);
    const tampered = `${token.slice(0, -3)}abc`;
    await expect(verifyAccessToken(tampered)).resolves.toBeNull();
  });

  it("rejects garbage", async () => {
    await expect(verifyAccessToken("not-a-jwt")).resolves.toBeNull();
    await expect(verifyAccessToken("")).resolves.toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const { SignJWT } = await import("jose");
    const foreign = await new SignJWT({ role: "manager", email: "x@y.z" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u-9")
      .setIssuer("n5deal")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("a-totally-different-secret-value-1234567890"));
    await expect(verifyAccessToken(foreign)).resolves.toBeNull();
  });
});
