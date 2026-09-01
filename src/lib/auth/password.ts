import { compare, hash } from "bcryptjs";

const COST = 10;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, COST);
}

export function verifyPassword(plain: string, digest: string): Promise<boolean> {
  return compare(plain, digest);
}
