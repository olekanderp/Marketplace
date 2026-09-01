import { Op, literal, type Order, type WhereOptions } from "sequelize";
import { db, type Asset } from "@/lib/db";
import type { AssetStatus, Role, UserStatus } from "@/lib/domain";
import { badRequest, forbidden, notFound } from "@/lib/http";
import {
  matchAsset,
  mandateIsUsable,
  type Mandate,
  type MatchResult,
} from "@/lib/match";
import {
  serializeAsset,
  serializeBuyerProfile,
  serializeConversation,
  serializeMessage,
  serializeSellerProfile,
  serializeUserAdmin,
  type AssetDTO,
} from "@/lib/serialize";
import type {
  AssetInput,
  AssetQuery,
  BuyerProfileInput,
  BuyerQuery,
} from "@/lib/validation";

/* ── slugs ────────────────────────────────────────────────────────────── */

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "asset";
}

const rand = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");

async function uniqueSlug(base: string): Promise<string> {
  const { Asset } = db();
  const root = slugify(base);
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = attempt === 0 ? root : `${root}-${rand(6)}`;
    const clash = await Asset.findOne({ where: { slug }, attributes: ["id"] });
    if (!clash) return slug;
  }
  return `${root}-${Date.now().toString(36)}`;
}

const SELLER_INCLUDE = {
  association: "seller" as const,
  attributes: ["id", "name", "role"],
};

/* ── assets: read ─────────────────────────────────────────────────────── */

export interface AssetListResult {
  items: (AssetDTO & { match?: MatchResult })[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

interface ListAssetsOpts {
  scope?: "published" | "all";
  sellerId?: string;
  mandate?: Mandate | null;
}

export async function listAssets(
  query: AssetQuery,
  opts: ListAssetsOpts = {},
): Promise<AssetListResult> {
  const { Asset } = db();
  const and: WhereOptions[] = [];
  const where: WhereOptions & Record<symbol, unknown> = {};

  if (opts.scope === "all") {
    // manager view — no status filter
  } else {
    where.status = "published";
  }
  if (opts.sellerId) where.sellerId = opts.sellerId;
  if (query.sector?.length) where.sector = { [Op.in]: query.sector };
  if (query.country?.length) where.country = { [Op.in]: query.country };
  if (query.businessStatus?.length) where.businessStatus = { [Op.in]: query.businessStatus };
  if (query.currency) where.currency = query.currency;

  if (query.priceMin != null || query.priceMax != null) {
    const bounds: WhereOptions = {};
    if (query.priceMin != null) Object.assign(bounds, { [Op.gte]: query.priceMin });
    if (query.priceMax != null) Object.assign(bounds, { [Op.lte]: query.priceMax });
    and.push(
      query.includeOnRequest
        ? { [Op.or]: [{ askingPrice: bounds }, { askingPrice: null }] }
        : { askingPrice: bounds },
    );
  }

  if (query.q) {
    const like = { [Op.iLike]: `%${query.q}%` };
    and.push({
      [Op.or]: [{ title: like }, { description: like }, { country: like }, { licenseType: like }],
    });
  }

  if (and.length) where[Op.and] = and;

  const order: Order =
    query.sort === "price_asc"
      ? [literal("asking_price ASC NULLS LAST")]
      : query.sort === "price_desc"
        ? [literal("asking_price DESC NULLS LAST")]
        : query.sort === "popular"
          ? [
              ["views", "DESC"],
              ["createdAt", "DESC"],
            ]
          : [["createdAt", "DESC"]];

  const { rows, count } = await Asset.findAndCountAll({
    where,
    order,
    include: [SELLER_INCLUDE],
    limit: query.perPage,
    offset: (query.page - 1) * query.perPage,
    distinct: true,
  });

  const useMatch = opts.mandate && mandateIsUsable(opts.mandate);
  const items = rows.map((a) => {
    const dto = serializeAsset(a);
    if (useMatch) {
      return {
        ...dto,
        match: matchAsset(opts.mandate as Mandate, {
          sector: a.sector,
          country: a.country,
          askingPrice: a.askingPrice,
          businessStatus: a.businessStatus,
          createdAt: a.createdAt,
        }),
      };
    }
    return dto;
  });

  return {
    items,
    total: count,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(count / query.perPage)),
  };
}

export async function getAssetRecordBySlug(slug: string) {
  const { Asset } = db();
  return Asset.findOne({ where: { slug }, include: [SELLER_INCLUDE] });
}

export async function getAssetRecordById(id: string) {
  const { Asset } = db();
  return Asset.findByPk(id, { include: [SELLER_INCLUDE] });
}

export async function incrementAssetViews(id: string): Promise<void> {
  const { Asset } = db();
  await Asset.increment("views", { by: 1, where: { id } });
}

export async function listSellerAssets(sellerId: string): Promise<AssetDTO[]> {
  const { Asset } = db();
  const rows = await Asset.findAll({
    where: { sellerId },
    order: [["createdAt", "DESC"]],
    include: [SELLER_INCLUDE],
  });
  return rows.map(serializeAsset);
}

/* ── assets: write ───────────────────────────────────────────────────── */

export async function createAsset(sellerId: string, input: AssetInput): Promise<AssetDTO> {
  const { Asset } = db();
  const slug = await uniqueSlug(`${input.title}`);
  const asset = await Asset.create({
    sellerId,
    slug,
    title: input.title,
    description: input.description,
    sector: input.sector,
    licenseType: input.licenseType,
    country: input.country,
    businessStatus: input.businessStatus,
    askingPrice: input.askingPrice,
    currency: input.currency,
    yearIssued: input.yearIssued,
    employees: input.employees,
    regulator: input.regulator,
    highlights: input.highlights,
    status: input.status,
  });
  return serializeAsset(asset);
}

export async function updateAsset(
  id: string,
  actor: { id: string; role: Role },
  input: Partial<AssetInput>,
): Promise<AssetDTO> {
  const { Asset } = db();
  const asset = await Asset.findByPk(id, { include: [SELLER_INCLUDE] });
  if (!asset) throw notFound("Asset not found");
  if (actor.role !== "manager" && asset.sellerId !== actor.id) {
    throw forbidden("You can only edit your own listings");
  }
  await asset.update(pruneUndefined(input));
  await asset.reload({ include: [SELLER_INCLUDE] });
  return serializeAsset(asset);
}

export async function deleteAsset(id: string, actor: { id: string; role: Role }): Promise<void> {
  const { Asset } = db();
  const asset = await Asset.findByPk(id);
  if (!asset) throw notFound("Asset not found");
  if (actor.role !== "manager" && asset.sellerId !== actor.id) {
    throw forbidden("You can only delete your own listings");
  }
  await asset.destroy();
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

/* ── profiles ─────────────────────────────────────────────────────────── */

export async function getBuyerProfile(userId: string) {
  const { BuyerProfile } = db();
  const p = await BuyerProfile.findOne({ where: { userId }, include: [{ association: "user", attributes: ["id", "name", "role"] }] });
  return p ? serializeBuyerProfile(p) : null;
}

export async function upsertBuyerProfile(userId: string, input: BuyerProfileInput) {
  const { BuyerProfile } = db();
  const [p] = await BuyerProfile.findOrCreate({ where: { userId }, defaults: { userId, ...input } });
  await p.update(input);
  await p.reload({ include: [{ association: "user", attributes: ["id", "name", "role"] }] });
  return serializeBuyerProfile(p);
}

export async function getSellerProfile(userId: string) {
  const { SellerProfile } = db();
  const p = await SellerProfile.findOne({ where: { userId }, include: [{ association: "user", attributes: ["id", "name", "role"] }] });
  return p ? serializeSellerProfile(p) : null;
}

export async function upsertSellerProfile(
  userId: string,
  input: { companyName: string; about: string; website: string },
) {
  const { SellerProfile } = db();
  const [p] = await SellerProfile.findOrCreate({ where: { userId }, defaults: { userId, ...input } });
  await p.update(input);
  await p.reload({ include: [{ association: "user", attributes: ["id", "name", "role"] }] });
  return serializeSellerProfile(p);
}

/* ── buyers directory (for sellers) ──────────────────────────────────── */

export async function listBuyers(query: BuyerQuery) {
  const { BuyerProfile } = db();
  const where: WhereOptions & Record<symbol, unknown> = {};
  const and: WhereOptions[] = [];

  // Numeric ticket overlap is safe to push down to SQL.
  if (query.ticket != null) {
    and.push({
      [Op.and]: [
        { [Op.or]: [{ ticketMin: null }, { ticketMin: { [Op.lte]: query.ticket } }] },
        { [Op.or]: [{ ticketMax: null }, { ticketMax: { [Op.gte]: query.ticket } }] },
      ],
    });
  }
  if (query.q) {
    const like = { [Op.iLike]: `%${query.q}%` };
    and.push({ [Op.or]: [{ headline: like }, { bio: like }, { mandate: like }] });
  }
  if (and.length) where[Op.and] = and;

  // Fetch the (small) candidate set, then filter JSONB facets in JS — avoids
  // hand-written SQL and keeps the query injection-safe.
  const rows = await BuyerProfile.findAll({
    where,
    include: [
      {
        association: "user",
        attributes: ["id", "name", "role", "status"],
        where: { status: "active" },
        required: true,
      },
    ],
    order: [["updatedAt", "DESC"]],
  });

  const filtered = rows.filter((p) => {
    if (query.sector?.length) {
      const set = new Set(p.targetSectors ?? []);
      if (!query.sector.some((s) => set.has(s))) return false;
    }
    if (query.jurisdiction) {
      const needle = query.jurisdiction.toLowerCase();
      const hit = (p.targetJurisdictions ?? []).some((j) => j.toLowerCase().includes(needle));
      if (!hit) return false;
    }
    return true;
  });

  const total = filtered.length;
  const start = (query.page - 1) * query.perPage;
  return {
    items: filtered.slice(start, start + query.perPage).map(serializeBuyerProfile),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
  };
}

export async function getBuyer(userId: string) {
  const { BuyerProfile } = db();
  const p = await BuyerProfile.findOne({
    where: { userId },
    include: [{ association: "user", attributes: ["id", "name", "role", "status"], where: { status: "active" }, required: true }],
  });
  return p ? serializeBuyerProfile(p) : null;
}

/* ── conversations / messages ────────────────────────────────────────── */

const CONVO_INCLUDE = [
  { association: "buyer", attributes: ["id", "name", "email", "role"] },
  { association: "seller", attributes: ["id", "name", "email", "role"] },
  { association: "asset", attributes: ["id", "title", "slug"] },
  { association: "messages", include: [{ association: "sender", attributes: ["id", "name", "role"] }] },
];

export async function listConversationsFor(userId: string) {
  const { Conversation } = db();
  const rows = await Conversation.findAll({
    where: { [Op.or]: [{ buyerId: userId }, { sellerId: userId }] },
    include: CONVO_INCLUDE,
    order: [["updatedAt", "DESC"]],
  });
  return rows
    .map((c) => serializeConversation(c, userId))
    .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
}

export async function getConversationFor(id: string, userId: string) {
  const { Conversation } = db();
  const c = await Conversation.findByPk(id, { include: CONVO_INCLUDE });
  if (!c) throw notFound("Conversation not found");
  if (c.buyerId !== userId && c.sellerId !== userId) throw forbidden();
  return serializeConversation(c, userId);
}

export async function startConversation(params: {
  actor: { id: string; role: Role };
  toUserId: string;
  assetId?: string;
  subject: string;
  message: string;
}) {
  const { Conversation, Message, User, Asset } = db();
  const { actor, toUserId } = params;

  if (toUserId === actor.id) throw badRequest("You cannot contact yourself");

  const other = await User.findByPk(toUserId);
  if (!other || other.status !== "active") throw notFound("Recipient not found");

  // Decide buyer/seller sides.
  let buyerId: string;
  let sellerId: string;
  if (actor.role === "buyer") {
    buyerId = actor.id;
    sellerId = toUserId;
  } else if (actor.role === "seller") {
    sellerId = actor.id;
    buyerId = toUserId;
  } else {
    throw forbidden("Managers cannot start conversations");
  }

  let assetId: string | null = null;
  let subject = params.subject;
  if (params.assetId) {
    const asset = await Asset.findByPk(params.assetId);
    if (!asset) throw notFound("Asset not found");
    if (asset.sellerId !== sellerId) throw badRequest("Asset does not belong to that seller");
    if (actor.role === "seller" && asset.sellerId !== actor.id) throw forbidden();
    assetId = asset.id;
    if (!subject) subject = `Re: ${asset.title}`;
  }
  if (!subject) subject = "New enquiry";

  const [conversation, created] = await Conversation.findOrCreate({
    where: { assetId, buyerId, sellerId },
    defaults: { assetId, buyerId, sellerId, subject },
  });
  await Message.create({ conversationId: conversation.id, senderId: actor.id, body: params.message });
  await conversation.update({ updatedAt: new Date() });

  const full = await Conversation.findByPk(conversation.id, { include: CONVO_INCLUDE });
  return { conversation: serializeConversation(full!, actor.id), created };
}

export async function postMessage(conversationId: string, senderId: string, body: string) {
  const { Conversation, Message } = db();
  const c = await Conversation.findByPk(conversationId);
  if (!c) throw notFound("Conversation not found");
  if (c.buyerId !== senderId && c.sellerId !== senderId) throw forbidden();
  const message = await Message.create({ conversationId, senderId, body });
  await c.update({ updatedAt: new Date() });
  const withSender = await Message.findByPk(message.id, {
    include: [{ association: "sender", attributes: ["id", "name", "role"] }],
  });
  return serializeMessage(withSender!);
}

export async function markConversationRead(conversationId: string, userId: string) {
  const { Conversation, Message } = db();
  const c = await Conversation.findByPk(conversationId);
  if (!c) throw notFound();
  if (c.buyerId !== userId && c.sellerId !== userId) throw forbidden();
  await Message.update(
    { readAt: new Date() },
    { where: { conversationId, senderId: { [Op.ne]: userId }, readAt: null } },
  );
}

/* ── recommendations ─────────────────────────────────────────────────── */

export async function recommendAssetsForBuyer(userId: string, limit = 6) {
  const { BuyerProfile, Asset } = db();
  const profile = await BuyerProfile.findOne({ where: { userId } });
  const mandate: Mandate = {
    targetSectors: profile?.targetSectors ?? [],
    targetJurisdictions: profile?.targetJurisdictions ?? [],
    ticketMin: profile?.ticketMin ?? null,
    ticketMax: profile?.ticketMax ?? null,
  };
  const rows = await Asset.findAll({
    where: { status: "published" },
    include: [SELLER_INCLUDE],
    order: [["createdAt", "DESC"]],
    limit: 60,
  });
  const scored = rows
    .map((a) => ({
      asset: serializeAsset(a),
      match: matchAsset(mandate, {
        sector: a.sector,
        country: a.country,
        askingPrice: a.askingPrice,
        businessStatus: a.businessStatus,
        createdAt: a.createdAt,
      }),
    }))
    .sort((x, y) => y.match.score - x.match.score)
    .slice(0, limit);
  return { mandateUsable: mandateIsUsable(mandate), items: scored };
}

export async function matchingBuyersForAsset(
  assetId: string,
  actor: { id: string; role: Role },
  limit = 6,
) {
  const { Asset, BuyerProfile } = db();
  const asset = await Asset.findByPk(assetId);
  if (!asset) throw notFound("Asset not found");
  if (actor.role !== "manager" && asset.sellerId !== actor.id) throw forbidden();

  const profiles = await BuyerProfile.findAll({
    include: [{ association: "user", attributes: ["id", "name", "role", "status"], where: { status: "active" }, required: true }],
    limit: 200,
  });

  const scored = profiles
    .map((p) => {
      const mandate: Mandate = {
        targetSectors: p.targetSectors ?? [],
        targetJurisdictions: p.targetJurisdictions ?? [],
        ticketMin: p.ticketMin ?? null,
        ticketMax: p.ticketMax ?? null,
      };
      return {
        buyer: serializeBuyerProfile(p),
        match: matchAsset(mandate, {
          sector: asset.sector,
          country: asset.country,
          askingPrice: asset.askingPrice,
          businessStatus: asset.businessStatus,
          createdAt: asset.createdAt,
        }),
      };
    })
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);

  return { asset: serializeAsset(asset), items: scored };
}

/* ── admin ───────────────────────────────────────────────────────────── */

export async function adminListUsers(params: {
  role?: Role;
  status?: UserStatus;
  q?: string;
  page: number;
  perPage: number;
}) {
  const { User } = db();
  const where: WhereOptions = {};
  if (params.role) Object.assign(where, { role: params.role });
  if (params.status) Object.assign(where, { status: params.status });
  if (params.q) {
    const like = { [Op.iLike]: `%${params.q}%` };
    Object.assign(where, { [Op.or]: [{ name: like }, { email: like }] });
  }
  const { rows, count } = await User.findAndCountAll({
    where,
    include: [
      { association: "buyerProfile", required: false },
      { association: "sellerProfile", required: false },
      { association: "assets", required: false, attributes: ["id"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: params.perPage,
    offset: (params.page - 1) * params.perPage,
    distinct: true,
  });
  return {
    items: rows.map(serializeUserAdmin),
    total: count,
    page: params.page,
    perPage: params.perPage,
    pageCount: Math.max(1, Math.ceil(count / params.perPage)),
  };
}

export async function adminSetUserStatus(id: string, status: UserStatus) {
  const { User } = db();
  const user = await User.findByPk(id);
  if (!user) throw notFound("User not found");
  if (user.role === "manager") throw forbidden("Manager accounts cannot be changed here");
  await user.update({ status });
  // Removing/suspending a seller also hides their live listings.
  if (status !== "active") {
    const { Asset } = db();
    await Asset.update(
      { status: "suspended" },
      { where: { sellerId: id, status: "published" } },
    );
  }
  return serializeUserAdmin(user);
}

export async function adminSetAssetStatus(id: string, status: AssetStatus) {
  const { Asset } = db();
  const asset = await Asset.findByPk(id, { include: [SELLER_INCLUDE] });
  if (!asset) throw notFound("Asset not found");
  await asset.update({ status });
  return serializeAsset(asset);
}

export function assetOwnedBy(asset: Asset, actor: { id: string; role: Role }): boolean {
  return actor.role === "manager" || asset.sellerId === actor.id;
}
