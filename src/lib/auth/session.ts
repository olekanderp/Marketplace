import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, type User } from "@/lib/db";
import { env } from "@/lib/env";
import type { Role } from "@/lib/domain";
import { forbidden, unauthorized } from "@/lib/http";
import { signAccessToken, verifyAccessToken, type AccessClaims } from "./jwt";
import { TOKEN_COOKIE } from "./constants";

export { TOKEN_COOKIE };

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifyAccessToken(token);
  if (!claims) return null;

  const user = await db().User.findByPk(claims.userId);
  if (!user || user.status !== "active") return null;
  return user;
});

export async function requireApiUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireApiRole(...roles: Role[]): Promise<User> {
  const user = await requireApiUser();
  if (!roles.includes(user.role)) throw forbidden(`Requires role: ${roles.join(" or ")}`);
  return user;
}

export async function requireUser(nextPath?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  return user;
}

export async function requireRole(roles: Role | Role[], nextPath?: string): Promise<User> {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const user = await requireUser(nextPath);
  if (!allowed.includes(user.role)) redirect(homePathFor(user.role));
  return user;
}

export function homePathFor(role: Role): string {
  return role === "manager" ? "/admin" : "/dashboard";
}

export async function redirectIfSignedIn(): Promise<void> {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));
}

export async function startSession(claims: AccessClaims): Promise<void> {
  const { token, maxAgeSeconds } = await signAccessToken(claims);
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env().COOKIE_SECURE,
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
}
