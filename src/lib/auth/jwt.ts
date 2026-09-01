import { SignJWT, decodeJwt, jwtVerify, type JWTPayload } from "jose";
import { env } from "@/lib/env";
import { isRole, type Role } from "@/lib/domain";

const ISSUER = "n5deal";
const FALLBACK_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface AccessClaims {
  userId: string;
  role: Role;
  email: string;
}

export interface SignedToken {
  token: string;
  maxAgeSeconds: number;
}

function key(): Uint8Array {
  return new TextEncoder().encode(env().JWT_SECRET);
}

export async function signAccessToken(claims: AccessClaims): Promise<SignedToken> {
  const token = await new SignJWT({ role: claims.role, email: claims.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(env().JWT_EXPIRES_IN)
    .sign(key());

  const { exp } = decodeJwt(token);
  const maxAgeSeconds = exp
    ? Math.max(1, exp - Math.floor(Date.now() / 1000))
    : FALLBACK_TTL_SECONDS;

  return { token, maxAgeSeconds };
}

export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify<JWTPayload & { role?: unknown; email?: unknown }>(
      token,
      key(),
      { issuer: ISSUER },
    );
    if (
      typeof payload.sub !== "string" ||
      !isRole(payload.role) ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return { userId: payload.sub, role: payload.role, email: payload.email };
  } catch {
    return null;
  }
}
