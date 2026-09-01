/** Shared enums / vocabulary for the marketplace domain. */

export const ROLES = ["buyer", "seller", "manager"] as const;
export type Role = (typeof ROLES)[number];

/** Roles a visitor may self-register as (manager accounts are seeded only). */
export const SIGNUP_ROLES = ["buyer", "seller"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const USER_STATUSES = ["active", "suspended", "removed"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const SECTORS = [
  "bank",
  "fintech",
  "payment",
  "emi",
  "crypto",
  "forex",
] as const;
export type Sector = (typeof SECTORS)[number];

export const SECTOR_LABELS: Record<Sector, string> = {
  bank: "Bank",
  fintech: "Fintech",
  payment: "Payment",
  emi: "EMI",
  crypto: "Crypto",
  forex: "Forex",
};

export const BUSINESS_STATUSES = ["active", "dormant", "in_development"] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  active: "Active",
  dormant: "Dormant",
  in_development: "In development",
};

export const ASSET_STATUSES = ["draft", "published", "suspended", "archived"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const CURRENCIES = ["USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/** A small, curated country list — enough to exercise filtering. */
export const COUNTRIES = [
  "United Kingdom",
  "Lithuania",
  "Brazil",
  "Germany",
  "United States",
  "Cyprus",
  "Estonia",
  "Singapore",
  "United Arab Emirates",
  "Switzerland",
  "Canada",
  "Poland",
] as const;
export type Country = (typeof COUNTRIES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
