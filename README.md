# N5Deal — marketplace prototype

A working full-stack prototype of an M&A marketplace for **regulated financial assets**
(licensed banks, EMIs, payment institutions, crypto/forex companies). Built for a
technical assignment; not a real service.

Three roles, each with its own flow:

| Role | Can |
| --- | --- |
| **Buyer** | maintain an acquisition *mandate*, browse & filter assets, get Smart-Match-ranked results, contact sellers |
| **Seller** | publish & manage asset listings, browse & filter buyers, contact buyers, see which buyers match a listing |
| **Platform Manager** | see all participants and listings, search/filter, suspend / remove / reactivate participants and listings |

---

## Quick start (Docker)

Requires Docker with Compose v2.

```bash
docker compose up --build
```

This starts three services:

1. **db** — `postgres:16-alpine`
2. **migrate** — runs `sequelize-cli db:migrate` + `db:seed:all`, then exits
   (idempotent — safe on every start)
3. **app** — the Next.js server, waits for `migrate` to finish

Then open **http://localhost:3000** (the DB is also exposed on host port **5433**).

> For any real deployment, override the JWT secret:
> `JWT_SECRET=$(openssl rand -base64 48) docker compose up --build`

### Demo accounts

All use the password **`Password123!`**

| Role | Email |
| --- | --- |
| Manager | `manager@n5deal.test` |
| Seller | `alex.seller@n5deal.test` (also `bianca.` / `caio.` / `dana.`) |
| Buyer | `finn.buyer@n5deal.test` (also `greta.` / `hugo.` / `ines.` / `jack.` / `kira.`) |
| Suspended seller | `flagged.seller@n5deal.test` — cannot sign in; used to demo moderation |

The login screen has one-click buttons to fill these in.

---

## Local development (without Docker)

```bash
# 1. a Postgres 16 for local use (host port 5433 to avoid clashing with :5432)
docker run -d --name n5deal-pg -p 5433:5432 \
  -e POSTGRES_USER=n5deal -e POSTGRES_PASSWORD=n5deal -e POSTGRES_DB=n5deal \
  postgres:16-alpine

# 2. env + deps
cp .env.example .env          # then set JWT_SECRET (openssl rand -base64 48)
npm install

# 3. schema + demo data
npm run db:migrate
npm run db:seed

# 4. run
npm run dev                   # http://localhost:3000
```

Useful scripts: `npm run typecheck`, `npm test`, `npm run db:reset`.

---

## Key technical decisions

**Next.js 16 (App Router) as a full-stack app.** The assignment asks for Next.js +
TypeScript and a working app. UI is server-rendered by default; interactive pieces
(filters, forms, messaging) are client components. Reads happen directly in server
components through a repository layer; writes go through REST route handlers under
`/api/*` so the same logic backs both the UI and any external client.

**PostgreSQL + Sequelize, schema by migration.** State persists in Postgres, so a
refresh (or a new device) just works — there is no client-only state to lose. The
schema is created by a single **sequelize-cli migration**; demo data is loaded by
**sequelize-cli seeders** with fixed UUIDs and `seederStorage: "sequelize"`, which
makes the migrate+seed step idempotent and safe to run on every container start.
`sequelize.sync()` is deliberately **not** used.

**Auth: JWT in an httpOnly cookie.** On login/registration the server issues an
HS256 JWT (via [`jose`](https://github.com/panva/jose), which works in both the
Node and the proxy runtime) and sets it as an `httpOnly`, `SameSite=Lax` cookie.
The token carries identity only — **account status is re-read from the database on
every request**, so a suspended user with a still-valid token is rejected
immediately. Passwords are hashed with `bcryptjs` (pure-JS, no native build on
Alpine).

**Authorization in two layers.** `src/proxy.ts` (Next 16's renamed middleware)
does *optimistic* redirects for UX. Real enforcement lives in every page
(`requireUser` / `requireRole`) and every route handler
(`requireApiUser` / `requireApiRole`) — a matcher change can never silently expose
a route.

**Infrastructure: Alpine images, decoupled migrator.** Multi-stage
`node:22-alpine` build; `postgres:16-alpine` for the database. Migrations run as a
**separate one-shot compose service** that the app `depends_on`
(`service_completed_successfully`), rather than in the app's entrypoint — so
schema changes are decoupled from app boot and multiple app replicas would not
race to migrate.

**"AI" functionality — Smart Match & Smart Validation.** A transparent,
deterministic recommender (`src/lib/match.ts`) scores every asset against a
buyer's mandate 0–100 across sector, jurisdiction, ticket-range and freshness,
with human-readable reasons. It powers the "Smart match NN%" badges on listings,
the buyer dashboard's "Recommended for you", and the seller's "buyers matching
this listing". On publish, **Smart Validation** warns about thin descriptions,
missing regulator/licence on regulated sectors, missing price, etc. This is a
heuristic rather than an LLM call: for a marketplace, a ranking users can inspect
and trust matters more than opacity, and it needs no API key to run.

---

## Data model

```
User(email⌷, password_hash, name, role[buyer|seller|manager],
     status[active|suspended|removed])
BuyerProfile  1:1 User   (headline, bio, mandate, target_sectors[],
                          target_jurisdictions[], ticket_min/max, currency)
SellerProfile 1:1 User   (company_name, about, website)
Asset  N:1 User(seller)  (title, slug⌷, description, sector, license_type,
                          country, business_status, asking_price?, currency,
                          year_issued, employees, regulator, highlights[],
                          status[draft|published|suspended|archived], views)
Conversation  N:1 Asset? · N:1 buyer · N:1 seller   ⌷(asset,buyer,seller)
Message       N:1 Conversation · N:1 sender         (body, read_at?)
```

`asking_price` is nullable — `null` renders as **"on LOI"** and is excluded from
min/max price filters unless the buyer opts in.

---

## Product / UX notes

- **Filters live in the URL** (`/listings?sector=emi&country=Lithuania&sort=price_asc`)
  so a filtered view survives refresh and can be shared.
- Listing cards mirror the N5Deal reference: country, licence type, business
  status, asking price, "Included" highlight tags, a "Validated" marker, an
  indicative trend sparkline, view count.
- "Contact" is in-app messaging (a `Conversation` + `Message`), reachable from
  both an asset page and a buyer profile, with a shared inbox and unread counts.
- Guests see a truncated overview and are prompted to sign in for the full
  company detail and to contact a seller — echoing the reference site's gated
  "Level 2/3" content.
- Suspending a seller in moderation also suspends their published listings.

## Assumptions

- Buyer profiles are public to sellers and managers; a buyer's **email is only
  revealed once a conversation exists**.
- "Contact" means starting an in-app thread, not sending real email.
- Manager accounts are seeded only — you cannot self-register as a manager.
- The market-trend chart is illustrative (deterministic from the listing slug),
  not real pricing data.
- Single-region, single-currency-per-listing; no payments/escrow (out of scope).

## What I'd improve with more time

- **Real automated e2e tests** (Playwright) over the full buyer→seller→manager
  flow; right now the automated tests cover the match engine, JWT and validation
  units, and the API was verified manually.
- Server-side **rate limiting** on `/api/auth/*` and CSRF tokens for the cookie
  session (currently relying on `SameSite=Lax`).
- **Multi-language** (next-intl) — the copy is structured for it but not wired.
- Real-time inbox (SSE/websocket) instead of refresh-on-send.
- Move Smart Match scoring into SQL / a materialised score for large catalogues;
  optional LLM pass for free-text mandate → structured facets.
- Image uploads for listings, a proper deal-room, audit log for moderation
  actions, email notifications.
- Refresh-token rotation and short-lived access tokens.

## AI tools used

Built with **Claude Code** (Anthropic) — architecture, the Sequelize/Next.js
integration, all route and component scaffolding, the match engine and tests,
and the Docker setup were produced in an agent loop, with the reference site
inspected live in a browser. Library APIs (Next.js 16, Sequelize CLI) were
checked against version-matched docs rather than assumed.

---

## Testing

```bash
npm test          # vitest: match engine, JWT, validation schemas  (22 tests)
npm run typecheck # tsc --noEmit
```

## Project structure

```
src/
  app/
    api/…                REST route handlers (auth, assets, buyers, conversations, admin, …)
    listings/            public browse + asset detail
    dashboard/ profile/ buyers/ assets/ inbox/ admin/   role pages
  components/            AssetCard, filters, MatchBadge, forms, nav, …
  lib/
    db/                  Sequelize singleton + models
    auth/                jwt (jose), password (bcryptjs), session/DAL
    repo.ts              all data-access used by pages and routes
    match.ts             Smart Match + Smart Validation
    validation.ts        zod schemas
    domain.ts            shared enums / vocabulary
  proxy.ts               optimistic route protection (Next 16 middleware)
config/ db/              sequelize-cli config, migration, seeders
Dockerfile docker-compose.yml
```
