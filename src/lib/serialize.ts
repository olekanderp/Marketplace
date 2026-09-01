import type {
  Asset,
  BuyerProfile,
  Conversation,
  Message,
  SellerProfile,
  User,
} from "@/lib/db";
import type {
  AssetStatus,
  BusinessStatus,
  Currency,
  Sector,
  UserStatus,
} from "@/lib/domain";

const iso = (value: Date | string | null | undefined): string | null =>
  value ? new Date(value).toISOString() : null;

const isoRequired = (value: Date | string): string => new Date(value).toISOString();

export function serializeUserPublic(u: User) {
  return { id: u.id, name: u.name, role: u.role };
}

export function serializeUserSelf(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status as UserStatus,
    createdAt: isoRequired(u.createdAt),
  };
}

export function serializeUserAdmin(u: User) {
  return {
    ...serializeUserSelf(u),
    buyerProfile: u.buyerProfile ? serializeBuyerProfile(u.buyerProfile) : null,
    sellerProfile: u.sellerProfile ? serializeSellerProfile(u.sellerProfile) : null,
    assetCount: Array.isArray(u.assets) ? u.assets.length : null,
  };
}

export function serializeAsset(a: Asset) {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    description: a.description as string,
    sector: a.sector as Sector,
    licenseType: a.licenseType as string,
    country: a.country,
    businessStatus: a.businessStatus as BusinessStatus,
    askingPrice: a.askingPrice as number | null,
    currency: a.currency as Currency,
    yearIssued: a.yearIssued as number | null,
    employees: a.employees ?? null,
    regulator: a.regulator ?? null,
    highlights: (a.highlights ?? []) as string[],
    status: a.status as AssetStatus,
    views: a.views as number,
    sellerId: a.sellerId,
    seller: a.seller ? serializeUserPublic(a.seller) : null,
    createdAt: isoRequired(a.createdAt),
    updatedAt: isoRequired(a.updatedAt),
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
    targetSectors: (p.targetSectors ?? []) as Sector[],
    targetJurisdictions: (p.targetJurisdictions ?? []) as string[],
    ticketMin: p.ticketMin as number | null,
    ticketMax: p.ticketMax as number | null,
    currency: p.currency as Currency,
    user: p.user ? serializeUserPublic(p.user) : null,
    updatedAt: isoRequired(p.updatedAt),
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
    user: p.user ? serializeUserPublic(p.user) : null,
    updatedAt: isoRequired(p.updatedAt),
  };
}

export type SellerProfileDTO = ReturnType<typeof serializeSellerProfile>;

export function serializeMessage(m: Message) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    body: m.body,
    readAt: iso(m.readAt),
    createdAt: isoRequired(m.createdAt),
    sender: m.sender ? serializeUserPublic(m.sender) : null,
  };
}

function conversationShell(c: Conversation, viewerId: string) {
  const viewerIsBuyer = c.buyerId === viewerId;
  const counterpart = viewerIsBuyer ? c.seller : c.buyer;
  return {
    id: c.id,
    subject: c.subject,
    assetId: c.assetId,
    asset: c.asset ? { id: c.asset.id, title: c.asset.title, slug: c.asset.slug } : null,
    buyerId: c.buyerId,
    sellerId: c.sellerId,
    viewerRole: viewerIsBuyer ? ("buyer" as const) : ("seller" as const),
    counterpart: counterpart
      ? {
          id: counterpart.id,
          name: counterpart.name,
          email: counterpart.email,
          role: counterpart.role,
          active: counterpart.status === "active",
        }
      : null,
    createdAt: isoRequired(c.createdAt),
  };
}

export function serializeConversationPreview(
  c: Conversation,
  viewerId: string,
  extra: { lastMessage: string | null; lastMessageAt: string; unread: number },
) {
  return {
    ...conversationShell(c, viewerId),
    lastMessage: extra.lastMessage,
    lastMessageAt: extra.lastMessageAt,
    unread: extra.unread,
  };
}

export function serializeConversation(c: Conversation, viewerId: string) {
  const messages = Array.isArray(c.messages)
    ? [...c.messages].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    : [];
  const last = messages.at(-1);
  return {
    ...serializeConversationPreview(c, viewerId, {
      lastMessage: last ? last.body : null,
      lastMessageAt: last ? isoRequired(last.createdAt) : isoRequired(c.createdAt),
      unread: messages.filter((m) => m.senderId !== viewerId && !m.readAt).length,
    }),
    messages: messages.map(serializeMessage),
  };
}
