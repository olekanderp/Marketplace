import { Op, literal, type Includeable, type Order, type WhereOptions } from "sequelize";
import { db, type Asset } from "@/lib/db";
import {
  isSellerAssetStatus,
  type AssetStatus,
  type Role,
  type UserStatus,
} from "@/lib/domain";
import { badRequest, forbidden, notFound } from "@/lib/http";
import {
  matchAsset,
  matchAssetForMandate,
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
  SellerProfileInput,
} from "@/lib/validation";

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

const randomSuffix = () => Math.random().toString(16).slice(2, 8);

async function uniqueSlug(base: string): Promise<string> {
  const { Asset } = db();
  const root = slugify(base);
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = attempt === 0 ? root : `${root}-${randomSuffix()}`;
    const clash = await Asset.findOne({ where: { slug }, attributes: ["id"] });
    if (!clash) return slug;
  }
  return `${root}-${Date.now().toString(36)}`;
}

const SELLER_ATTRS = ["id", "name", "role", "status"] as const;

const sellerInclude = (onlyActive: boolean): Includeable => ({
  association: "seller",
  attributes: [...SELLER_ATTRS],
  ...(onlyActive ? { where: { status: "active" }, required: true } : {}),
});

export interface AssetListResult {
  items: (AssetDTO & { match?: MatchResult })[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

interface ListAssetsOpts {
  scope?: "published" | "all";
  mandate?: Mandate | null;
}

export async function listAssets(
  query: AssetQuery,
  opts: ListAssetsOpts = {},
): Promise<AssetListResult> {
  const { Asset } = db();
  const publicScope = opts.scope !== "all";
  const and: WhereOptions[] = [];
  const where: WhereOptions & Record<symbol, unknown> = {};

  if (publicScope) where.status = "published";
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
    include: [sellerInclude(publicScope)],
    limit: query.perPage,
    offset: (query.page - 1) * query.perPage,
    distinct: true,
  });

  const items = rows.map((a) => {
    const dto = serializeAsset(a);
    const match = matchAssetForMandate(opts.mandate ?? null, {
      sector: a.sector,
      country: a.country,
      askingPrice: a.askingPrice,
      businessStatus: a.businessStatus,
      createdAt: a.createdAt,
    });
    return match ? { ...dto, match } : dto;
  });

  return {
    items,
    total: count,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(count / query.perPage)),
  };
}

export async function listAssetCountries(): Promise<string[]> {
  const { Asset } = db();
  const rows = await Asset.findAll({
    attributes: ["country"],
    where: { status: "published" },
    group: ["country"],
    order: [["country", "ASC"]],
    raw: true,
  });
  return (rows as unknown as { country: string }[]).map((r) => r.country);
}

export async function getAssetRecordBySlug(slug: string) {
  const { Asset } = db();
  return Asset.findOne({ where: { slug }, include: [sellerInclude(false)] });
}

export async function getAssetRecordById(id: string) {
  const { Asset } = db();
  return Asset.findByPk(id, { include: [sellerInclude(false)] });
}

export function assetIsPubliclyVisible(asset: Asset): boolean {
  return asset.status === "published" && asset.seller?.status === "active";
}

export function assetOwnedBy(asset: Asset, actor: { id: string; role: Role }): boolean {
  return actor.role === "manager" || asset.sellerId === actor.id;
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
    include: [sellerInclude(false)],
  });
  return rows.map(serializeAsset);
}

export async function createAsset(sellerId: string, input: AssetInput): Promise<AssetDTO> {
  const { Asset } = db();
  const asset = await Asset.create({
    sellerId,
    slug: await uniqueSlug(input.title),
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
  await asset.reload({ include: [sellerInclude(false)] });
  return serializeAsset(asset);
}

export async function updateAsset(
  id: string,
  actor: { id: string; role: Role },
  input: Partial<AssetInput>,
): Promise<AssetDTO> {
  const { Asset } = db();
  const asset = await Asset.findByPk(id, { include: [sellerInclude(false)] });
  if (!asset) throw notFound("Asset not found");
  if (actor.role !== "manager" && asset.sellerId !== actor.id) {
    throw forbidden("You can only edit your own listings");
  }

  const patch = pruneUndefined(input);

  if (actor.role !== "manager" && patch.status !== undefined) {
    if (asset.status === "suspended") {
      throw forbidden(
        "This listing was suspended by the platform. Contact the platform team to restore it.",
      );
    }
    if (!isSellerAssetStatus(patch.status)) {
      throw forbidden("Only the platform team can set that status");
    }
  }

  await asset.update(patch);
  await asset.reload({ include: [sellerInclude(false)] });
  return serializeAsset(asset);
}

export async function deleteAsset(id: string, actor: { id: string; role: Role }): Promise<void> {
  const { Asset } = db();
  const asset = await Asset.findByPk(id);
  if (!asset) throw notFound("Asset not found");
  if (actor.role !== "manager" && asset.sellerId !== actor.id) {
    throw forbidden("You can only delete your own listings");
  }
  if (actor.role !== "manager" && asset.status === "suspended") {
    throw forbidden("Suspended listings can only be removed by the platform team");
  }
  await asset.destroy();
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

const PROFILE_USER_INCLUDE: Includeable = {
  association: "user",
  attributes: ["id", "name", "role", "status"],
};

export async function getMandate(userId: string): Promise<Mandate | null> {
  const { BuyerProfile } = db();
  const p = await BuyerProfile.findOne({ where: { userId } });
  if (!p) return null;
  return {
    targetSectors: p.targetSectors ?? [],
    targetJurisdictions: p.targetJurisdictions ?? [],
    ticketMin: p.ticketMin ?? null,
    ticketMax: p.ticketMax ?? null,
  };
}

export async function getBuyerProfile(userId: string) {
  const { BuyerProfile } = db();
  const p = await BuyerProfile.findOne({
    where: { userId },
    include: [PROFILE_USER_INCLUDE],
  });
  return p ? serializeBuyerProfile(p) : null;
}

export async function upsertBuyerProfile(userId: string, input: BuyerProfileInput) {
  const { BuyerProfile } = db();
  const [p] = await BuyerProfile.findOrCreate({
    where: { userId },
    defaults: { userId, ...input },
  });
  await p.update(input);
  await p.reload({ include: [PROFILE_USER_INCLUDE] });
  return serializeBuyerProfile(p);
}

export async function getSellerProfile(userId: string) {
  const { SellerProfile } = db();
  const p = await SellerProfile.findOne({
    where: { userId },
    include: [PROFILE_USER_INCLUDE],
  });
  return p ? serializeSellerProfile(p) : null;
}

export async function upsertSellerProfile(userId: string, input: SellerProfileInput) {
  const { SellerProfile } = db();
  const [p] = await SellerProfile.findOrCreate({
    where: { userId },
    defaults: { userId, ...input },
  });
  await p.update(input);
  await p.reload({ include: [PROFILE_USER_INCLUDE] });
  return serializeSellerProfile(p);
}

const ACTIVE_USER_INCLUDE: Includeable = {
  association: "user",
  attributes: ["id", "name", "role", "status"],
  where: { status: "active" },
  required: true,
};

export async function listBuyers(query: BuyerQuery) {
  const { BuyerProfile } = db();
  const where: WhereOptions & Record<symbol, unknown> = {};
  const and: WhereOptions[] = [];

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

  const rows = await BuyerProfile.findAll({
    where,
    include: [ACTIVE_USER_INCLUDE],
    order: [["updatedAt", "DESC"]],
  });

  const filtered = rows.filter((p) => {
    if (query.sector?.length) {
      const set = new Set(p.targetSectors ?? []);
      if (!query.sector.some((s) => set.has(s))) return false;
    }
    if (query.jurisdiction) {
      const needle = query.jurisdiction.toLowerCase();
      if (!(p.targetJurisdictions ?? []).some((j) => j.toLowerCase().includes(needle))) {
        return false;
      }
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
    include: [ACTIVE_USER_INCLUDE],
  });
  return p ? serializeBuyerProfile(p) : null;
}

const CONVO_INCLUDE: Includeable[] = [
  { association: "buyer", attributes: ["id", "name", "email", "role", "status"] },
  { association: "seller", attributes: ["id", "name", "email", "role", "status"] },
  { association: "asset", attributes: ["id", "title", "slug", "status"] },
  {
    association: "messages",
    include: [{ association: "sender", attributes: ["id", "name", "role"] }],
  },
];

export async function listConversationsFor(userId: string) {
  const { Conversation } = db();
  const rows = await Conversation.findAll({
    where: { [Op.or]: [{ buyerId: userId }, { sellerId: userId }] },
    include: CONVO_INCLUDE,
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

  let buyerId: string;
  let sellerId: string;
  if (actor.role === "buyer") {
    if (other.role !== "seller") throw badRequest("Buyers can only contact sellers");
    buyerId = actor.id;
    sellerId = toUserId;
  } else if (actor.role === "seller") {
    if (other.role !== "buyer") throw badRequest("Sellers can only contact buyers");
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
    if (asset.status !== "published" && asset.sellerId !== actor.id) {
      throw notFound("Asset not found");
    }
    assetId = asset.id;
    if (!subject) subject = `Re: ${asset.title}`;
  }
  if (!subject) subject = "New enquiry";

  const [conversation, created] = await Conversation.findOrCreate({
    where: { assetId, buyerId, sellerId },
    defaults: { assetId, buyerId, sellerId, subject },
  });
  await Message.create({
    conversationId: conversation.id,
    senderId: actor.id,
    body: params.message,
  });
  await touch(conversation.id);

  const full = await Conversation.findByPk(conversation.id, { include: CONVO_INCLUDE });
  if (!full) throw notFound("Conversation not found");
  return { conversation: serializeConversation(full, actor.id), created };
}

async function touch(conversationId: string): Promise<void> {
  const { Conversation } = db();
  await Conversation.update(
    { updatedAt: new Date() },
    { where: { id: conversationId }, silent: true },
  );
}

export async function postMessage(conversationId: string, senderId: string, body: string) {
  const { Conversation, Message } = db();
  const c = await Conversation.findByPk(conversationId);
  if (!c) throw notFound("Conversation not found");
  if (c.buyerId !== senderId && c.sellerId !== senderId) throw forbidden();

  const message = await Message.create({ conversationId, senderId, body });
  await touch(conversationId);

  const withSender = await Message.findByPk(message.id, {
    include: [{ association: "sender", attributes: ["id", "name", "role"] }],
  });
  if (!withSender) throw notFound("Message not found");
  return serializeMessage(withSender);
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  const { Conversation, Message } = db();
  const c = await Conversation.findByPk(conversationId);
  if (!c) throw notFound("Conversation not found");
  if (c.buyerId !== userId && c.sellerId !== userId) throw forbidden();
  await Message.update(
    { readAt: new Date() },
    { where: { conversationId, senderId: { [Op.ne]: userId }, readAt: null } },
  );
}

export async function recommendAssetsForBuyer(userId: string, limit = 6) {
  const mandate = await getMandate(userId);
  if (!mandate || !mandateIsUsable(mandate)) {
    return { mandateUsable: false, items: [] };
  }

  const { Asset } = db();
  const rows = await Asset.findAll({
    where: { status: "published" },
    include: [sellerInclude(true)],
    order: [["createdAt", "DESC"]],
    limit: 100,
  });

  const items = rows
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

  return { mandateUsable: true, items };
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
    include: [ACTIVE_USER_INCLUDE],
    limit: 500,
  });

  const items = profiles
    .flatMap((p) => {
      const mandate: Mandate = {
        targetSectors: p.targetSectors ?? [],
        targetJurisdictions: p.targetJurisdictions ?? [],
        ticketMin: p.ticketMin ?? null,
        ticketMax: p.ticketMax ?? null,
      };
      const match = matchAssetForMandate(mandate, {
        sector: asset.sector,
        country: asset.country,
        askingPrice: asset.askingPrice,
        businessStatus: asset.businessStatus,
        createdAt: asset.createdAt,
      });
      return match ? [{ buyer: serializeBuyerProfile(p), match }] : [];
    })
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);

  return { asset: serializeAsset(asset), items };
}

export async function adminListUsers(params: {
  role?: Role;
  status?: UserStatus;
  q?: string;
  page: number;
  perPage: number;
}) {
  const { User } = db();
  const where: WhereOptions & Record<symbol, unknown> = {};
  if (params.role) where.role = params.role;
  if (params.status) where.status = params.status;
  if (params.q) {
    const like = { [Op.iLike]: `%${params.q}%` };
    where[Op.and] = [{ [Op.or]: [{ name: like }, { email: like }] }];
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
  const user = await User.findByPk(id, {
    include: [
      { association: "buyerProfile", required: false },
      { association: "sellerProfile", required: false },
      { association: "assets", required: false, attributes: ["id"] },
    ],
  });
  if (!user) throw notFound("User not found");
  if (user.role === "manager") throw forbidden("Manager accounts cannot be changed here");
  await user.update({ status });
  return serializeUserAdmin(user);
}

export async function adminSetAssetStatus(id: string, status: AssetStatus) {
  const { Asset } = db();
  const asset = await Asset.findByPk(id, { include: [sellerInclude(false)] });
  if (!asset) throw notFound("Asset not found");
  await asset.update({ status });
  await asset.reload({ include: [sellerInclude(false)] });
  return serializeAsset(asset);
}
