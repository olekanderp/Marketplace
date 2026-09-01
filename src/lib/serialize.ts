import type {
  Asset,
  BuyerProfile,
  Conversation,
  Message,
  SellerProfile,
  User,
} from "@/lib/db";

const iso = (d: Date | string | undefined | null): string =>
  d ? new Date(d).toISOString() : new Date(0).toISOString();

export function serializeUserPublic(u: User) {
  return { id: u.id, name: u.name, role: u.role };
}

export function serializeUserSelf(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: iso(u.createdAt),
  };
}

export function serializeUserAdmin(u: User) {
  return {
    ...serializeUserSelf(u),
    buyerProfile: u.buyerProfile ? serializeBuyerProfile(u.buyerProfile) : null,
    sellerProfile: u.sellerProfile ? serializeSellerProfile(u.sellerProfile) : null,
    assetCount: Array.isArray(u.assets) ? u.assets.length : undefined,
  };
}

export function serializeAsset(a: Asset) {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    description: a.description,
    sector: a.sector,
    licenseType: a.licenseType,
    country: a.country,
    businessStatus: a.businessStatus,
    askingPrice: a.askingPrice, // number | null  (null === "on LOI")
    currency: a.currency,
    yearIssued: a.yearIssued,
    employees: a.employees ?? null,
    regulator: a.regulator ?? null,
    highlights: a.highlights ?? [],
    status: a.status,
    views: a.views,
    sellerId: a.sellerId,
    seller: a.seller ? serializeUserPublic(a.seller) : undefined,
    createdAt: iso(a.createdAt),
    updatedAt: iso(a.updatedAt),
  };
}

export type AssetDTO = ReturnType<typeof serializeAsset>;

export function serializeBuyerProfile(p: BuyerProfile) {
  return {
    id: p.id,
    userId: p.userId,
    headline: p.headline,
    bio: p.bio,
    mandate: p.mandate,
    targetSectors: p.targetSectors ?? [],
    targetJurisdictions: p.targetJurisdictions ?? [],
    ticketMin: p.ticketMin,
    ticketMax: p.ticketMax,
    currency: p.currency,
    user: p.user ? serializeUserPublic(p.user) : undefined,
    updatedAt: iso(p.updatedAt),
  };
}

export type BuyerProfileDTO = ReturnType<typeof serializeBuyerProfile>;

export function serializeSellerProfile(p: SellerProfile) {
  return {
    id: p.id,
    userId: p.userId,
    companyName: p.companyName,
    about: p.about,
    website: p.website ?? null,
    user: p.user ? serializeUserPublic(p.user) : undefined,
    updatedAt: iso(p.updatedAt),
  };
}

export function serializeMessage(m: Message) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    body: m.body,
    readAt: m.readAt ? iso(m.readAt) : null,
    createdAt: iso(m.createdAt),
    sender: m.sender ? serializeUserPublic(m.sender) : undefined,
  };
}

export function serializeConversation(c: Conversation, viewerId: string) {
  const counterpart = c.buyerId === viewerId ? c.seller : c.buyer;
  const messages = Array.isArray(c.messages)
    ? [...c.messages].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    : [];
  return {
    id: c.id,
    subject: c.subject,
    assetId: c.assetId,
    asset: c.asset ? { id: c.asset.id, title: c.asset.title, slug: c.asset.slug } : null,
    buyerId: c.buyerId,
    sellerId: c.sellerId,
    role: c.buyerId === viewerId ? "buyer" : "seller",
    counterpart: counterpart
      ? { id: counterpart.id, name: counterpart.name, email: counterpart.email, role: counterpart.role }
      : null,
    messages: messages.map(serializeMessage),
    lastMessageAt: messages.length ? iso(messages[messages.length - 1].createdAt) : iso(c.createdAt),
    unread: messages.filter((m) => m.senderId !== viewerId && !m.readAt).length,
    createdAt: iso(c.createdAt),
  };
}

export type ConversationDTO = ReturnType<typeof serializeConversation>;
