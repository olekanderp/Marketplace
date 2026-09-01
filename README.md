# N5Deal — marketplace prototype

A working full-stack prototype of an M&A marketplace for **regulated financial assets**
(licensed banks, EMIs, payment institutions, crypto/forex companies). Built for a
technical assignment; not a real service.

**Live demo:** [https://n5deal-snowy.vercel.app](https://n5deal-snowy.vercel.app)

Password for all demo accounts: **`Password123!`** — or use the one-click buttons on
[`/login`](https://n5deal-snowy.vercel.app/login).

| Role | Login |
| --- | --- |
| Buyer | `buyer@n5deal.test` |
| Seller | `seller@n5deal.test` |
| Manager | `manager@n5deal.test` |

| Role | Can |
| --- | --- |
| **Buyer** | maintain an acquisition *mandate*, browse & filter assets, get Smart-Match-ranked results, contact sellers |
| **Seller** | publish & manage listings, maintain a company profile, browse & filter buyers, contact buyers, see which buyers match a listing |
| **Platform Manager** | see all participants and listings, search/filter, suspend / remove / reactivate participants and listings |

- 📋 **[TESTING.md](./TESTING.md)** — how to run, check and test everything, step by step.
- 🐞 **[BUGFIXES.md](./BUGFIXES.md)** — the code-review findings and what changed.

---

## Quick start (Docker)

Requires Docker with Compose v2.

```bash
docker compose up --build
```

Three services start in order: **db** (`postgres:16-alpine`) → **migrate**
(runs `sequelize-cli db:migrate` + `db:seed:all`, then exits — idempotent, safe on
every start) → **app**.

Open **http://localhost:3000**. The database is also exposed on host port **5433**.

> For any real deployment, override the JWT secret:
> `JWT_SECRET=$(openssl rand -base64 48) docker compose up --build`

### Demo accounts — one per role

Password for all accounts: **`Password123!`** (one-click buttons on the sign-in screen)

| Role | Login |
| --- | --- |
| Buyer | `buyer@n5deal.test` |
| Seller | `seller@n5deal.test` |
| Manager | `manager@n5deal.test` |

The seed also creates 3 more sellers, 5 more buyers with distinct mandates, and one
**suspended** seller, so filtering, ranking and moderation have realistic data to work
against. Full list in [TESTING.md](./TESTING.md#2-demo-accounts).

---

## Local development

```bash
docker run -d --name n5deal-pg -p 5433:5432 \
  -e POSTGRES_USER=n5deal -e POSTGRES_PASSWORD=n5deal -e POSTGRES_DB=n5deal \
  postgres:16-alpine

cp .env.example .env          # set JWT_SECRET: openssl rand -base64 48
npm install
npm run db:migrate && npm run db:seed
npm run dev                   # http://localhost:3000
```

| Script | Does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev / production build / production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest — 48 unit tests, no database needed |
| `npm run db:migrate` / `db:seed` | apply schema / load demo data |
| `npm run db:reset` | undo seeds + migrations, re-apply, re-seed |

---

## Key technical decisions

**Next.js 16 (App Router) as a full-stack app.** UI is server-rendered by default;
interactive pieces (filters, forms, messaging) are client components. Reads happen
directly in server components through a repository layer; writes go through REST
route handlers under `/api/*`, so the same logic backs both the UI and any external
client.

**PostgreSQL + Sequelize, schema by migration.** State lives in Postgres, so a
refresh — or a different device — just works. The schema is created by
**sequelize-cli migrations**; demo data is loaded by **sequelize-cli seeders** with
fixed UUIDs and `seederStorage: "sequelize"`, which makes migrate+seed idempotent and
safe to run on every container start. `sequelize.sync()` is deliberately **not** used.

**Auth: JWT in an httpOnly cookie.** On login the server issues an HS256 JWT (via
[`jose`](https://github.com/panva/jose), which works in both the Node and the proxy
runtime) and sets it as an `httpOnly`, `SameSite=Lax` cookie whose lifetime is derived
from the token's own `exp` claim. The token carries identity only — **account status
is re-read from the database on every request**, so a suspended user with a still-valid
token is rejected immediately. Passwords are hashed with `bcryptjs` (pure JS, no native
build on Alpine).

**Authorization in two layers.** `src/proxy.ts` (Next 16's renamed middleware) does
*optimistic* redirects for the six protected path prefixes only. Real enforcement lives
in every page (`requireUser` / `requireRole`) and every route handler
(`requireApiUser` / `requireApiRole`), so a matcher change can never silently expose a
route. Signed-in users are bounced off `/login` by the page itself, not the proxy —
doing it in the proxy caused a redirect loop for suspended accounts
([BUGFIXES #2](./BUGFIXES.md)).

**Moderation is derived, not destructive.** Suspending a participant does not rewrite
their listings. The public asset query requires the seller to be `active`, so
suspension hides the listings and reactivation brings them back. `suspended` is a
platform-only listing status that a seller cannot set or clear.

**Infrastructure: Alpine images, decoupled migrator.** Multi-stage `node:22-alpine`
build, `postgres:16-alpine` database. Migrations run as a **separate one-shot compose
service** that the app `depends_on` (`service_completed_successfully`) rather than in
the app's entrypoint, so schema changes are decoupled from app boot and multiple app
replicas would not race to migrate.

**"AI" functionality — Smart Match & Smart Validation.** A transparent, deterministic
recommender (`src/lib/match.ts`) scores an asset against a buyer's mandate 0–100 across
sector, jurisdiction, ticket range and freshness, returning human-readable `reasons`
and `caveats`. It powers the "Smart match NN%" badges, the buyer's "Recommended for
you" and the seller's "buyers matching this listing". **It scores nothing when the
mandate is empty** — an invented percentage is worse than no percentage. On save,
**Smart Validation** warns about thin descriptions, a missing regulator or licence on a
regulated sector, a missing price, and so on. A heuristic rather than an LLM call: for
a marketplace, a ranking users can inspect and trust matters more than opacity, and it
needs no API key to run.

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

- **Filters live in the URL** (`/listings?sector=emi&country=Lithuania&sort=price_asc`),
  so a filtered view survives refresh and can be shared.
- Country filter options come from the listings actually in the database, not a
  hardcoded list, so a seller-entered jurisdiction is immediately filterable.
- Listing cards mirror the N5Deal reference: country, licence type, business status,
  asking price, an earned "Validated" marker (only when Smart Validation is clean), an indicative trend
  sparkline, view count.
- "Contact" is in-app messaging (a `Conversation` + `Message`), reachable from both an
  asset page and a buyer profile, with a shared inbox and unread counts.
- Guests see a truncated overview and are prompted to sign in for the full company
  detail and to contact a seller — echoing the reference site's gated content.

## Assumptions

- Buyer profiles are public to sellers and managers; a buyer's **email is only revealed
  once a conversation exists**.
- "Contact" means starting an in-app thread, not sending real email.
- Manager accounts are seeded only — you cannot self-register as a manager.
- The market-trend chart is illustrative (deterministic from the listing slug), not
  real pricing data.
- Single-region, one currency per listing; no payments or escrow.

## What I'd improve with more time

- **End-to-end tests** (Playwright) over the full buyer→seller→manager flow. Automated
  coverage currently stops at the unit level; the flows were verified manually and the
  regression commands are written up in [TESTING.md](./TESTING.md#4-regression-checks-for-the-fixed-bugs).
- Server-side **rate limiting** on `/api/auth/*` and CSRF tokens for the cookie session
  (currently relying on `SameSite=Lax`).
- Refresh-token rotation with short-lived access tokens.
- Real-time inbox (SSE/websocket) instead of refresh-on-send.
- An **audit log** for moderation actions — right now a suspension leaves no record of
  who did it or why.
- Move Smart Match scoring into SQL or a materialised score for large catalogues; an
  optional LLM pass to turn a free-text mandate into structured facets.
- Multi-language (next-intl) — the copy is structured for it but not wired.
- Image uploads, a real deal room, email notifications.

## AI tools used

Built with **Claude Code** (Anthropic) — architecture, the Sequelize/Next.js
integration, route and component scaffolding, the match engine and tests, the Docker
setup, and the review pass documented in [BUGFIXES.md](./BUGFIXES.md) were produced in
an agent loop, with the reference site inspected live in a browser. Library APIs
(Next.js 16, Sequelize CLI, Zod 4) were checked against version-matched docs rather
than assumed.

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
    repo.ts              all data access used by pages and routes
    match.ts             Smart Match + Smart Validation
    validation.ts        Zod schemas
    domain.ts            shared enums / vocabulary
  proxy.ts               optimistic route protection (Next 16 middleware)
config/ db/              sequelize-cli config, migration, seeders, fixtures
Dockerfile docker-compose.yml
```

## Known limitations

- `npm audit` reports a moderate advisory for a transitive `uuid@8` inside Sequelize 6
  (missing bounds check when an explicit output buffer is passed — never our code path).
  `npm audit fix --force` would downgrade Sequelize to v3, so it is left as-is.
- Admin lists page at 20 rows; there is no bulk moderation.
