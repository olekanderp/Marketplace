import { z } from "zod";
import {
  ASSET_STATUSES,
  BUSINESS_STATUSES,
  CURRENCIES,
  SECTORS,
  SELLER_ASSET_STATUSES,
  SIGNUP_ROLES,
  USER_STATUSES,
} from "@/lib/domain";

const oneOf = <T extends readonly string[]>(values: T) =>
  z
    .string()
    .refine((v): v is T[number] => (values as readonly string[]).includes(v), {
      message: `Expected one of: ${values.join(", ")}`,
    });

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const money = z.preprocess(
  emptyToNull,
  z.coerce.number().int().min(0).max(1_000_000_000_000).nullable(),
);

const year = z.preprocess(
  emptyToNull,
  z.coerce.number().int().min(1900).max(2100).nullable(),
);

const email = z.string().trim().toLowerCase().pipe(z.email().max(200));
const uuid = z.string().pipe(z.uuid());

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  password: z.string().min(8).max(200),
  role: oneOf(SIGNUP_ROLES),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export const assetCreateSchema = z.object({
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().max(8000).default(""),
  sector: oneOf(SECTORS),
  licenseType: z.string().trim().max(120).default(""),
  country: z.string().trim().min(2).max(120),
  businessStatus: oneOf(BUSINESS_STATUSES).default("active"),
  askingPrice: money.default(null),
  currency: oneOf(CURRENCIES).default("USD"),
  yearIssued: year.default(null),
  employees: z.string().trim().max(60).nullable().default(null),
  regulator: z.string().trim().max(120).nullable().default(null),
  highlights: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  status: oneOf(SELLER_ASSET_STATUSES).default("draft"),
});

export const assetUpdateSchema = assetCreateSchema.partial();

export const buyerProfileSchema = z
  .object({
    headline: z.string().trim().max(160).default(""),
    bio: z.string().trim().max(4000).default(""),
    mandate: z.string().trim().max(4000).default(""),
    targetSectors: z.array(oneOf(SECTORS)).max(SECTORS.length).default([]),
    targetJurisdictions: z.array(z.string().trim().min(2).max(120)).max(20).default([]),
    ticketMin: money.default(null),
    ticketMax: money.default(null),
    currency: oneOf(CURRENCIES).default("USD"),
  })
  .refine((v) => v.ticketMin === null || v.ticketMax === null || v.ticketMin <= v.ticketMax, {
    message: "Minimum ticket must not exceed the maximum",
    path: ["ticketMin"],
  });

export const sellerProfileSchema = z.object({
  companyName: z.string().trim().max(160).default(""),
  about: z.string().trim().max(4000).default(""),
  website: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Must be a URL or empty")
    .default(""),
});

export const startConversationSchema = z.object({
  toUserId: uuid,
  assetId: uuid.optional(),
  subject: z.string().trim().max(160).default(""),
  message: z.string().trim().min(1).max(5000),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const adminUserUpdateSchema = z.object({
  status: oneOf(USER_STATUSES),
});

export const adminAssetUpdateSchema = z.object({
  status: oneOf(ASSET_STATUSES),
});

const price = z.preprocess(emptyToNull, z.coerce.number().int().min(0).nullable());

export const assetQuerySchema = z
  .object({
    q: z.string().trim().max(160).optional(),
    sector: z.array(oneOf(SECTORS)).optional(),
    country: z.array(z.string().trim().min(1)).optional(),
    businessStatus: z.array(oneOf(BUSINESS_STATUSES)).optional(),
    currency: oneOf(CURRENCIES).optional(),
    priceMin: price.optional(),
    priceMax: price.optional(),
    includeOnRequest: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(48).default(12),
  })
  .transform((v) => ({
    ...v,
    priceMin: v.priceMin ?? undefined,
    priceMax: v.priceMax ?? undefined,
  }));

export const buyerQuerySchema = z.object({
  q: z.string().trim().max(160).optional(),
  sector: z.array(oneOf(SECTORS)).optional(),
  jurisdiction: z.string().trim().max(120).optional(),
  ticket: price.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(12),
});

export type AssetInput = z.infer<typeof assetCreateSchema>;
export type BuyerProfileInput = z.infer<typeof buyerProfileSchema>;
export type SellerProfileInput = z.infer<typeof sellerProfileSchema>;
export type AssetQuery = z.infer<typeof assetQuerySchema>;
export type BuyerQuery = z.infer<typeof buyerQuerySchema>;
