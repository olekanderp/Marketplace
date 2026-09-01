# Bugs found in review, and what was changed

A code audit of the whole prototype (logic, security, dead code). Every item below
was **reproduced first**, then fixed, then re-verified. Reproduction and
verification commands are in [`TESTING.md`](./TESTING.md).

Legend — **S** severity: 🔴 critical · 🟠 significant · 🟡 minor · ⚪ cleanup

---

## 🔴 Critical

### 1. Moderation could be undone by the seller
**S** 🔴 · `src/lib/repo.ts`, `src/lib/validation.ts`, `src/lib/domain.ts`

`assetUpdateSchema` allowed `status: "published"`, and `updateAsset` did not look at
the *current* status. A manager could suspend a listing and its owner could simply
`PATCH /api/assets/:id {"status":"published"}` to put it straight back on the
marketplace. Moderation was decorative.

*Repro (before):* manager sets `suspended` → seller PATCHes `published` → `200`, live again.

**Fix** — split the status vocabulary: `SELLER_ASSET_STATUSES` (`draft`,
`published`, `archived`) is what the public schema accepts; `suspended` is now
platform-only. `updateAsset` additionally refuses **any** status change by a
non-manager while the listing is `suspended`, and `deleteAsset` refuses to let a
seller delete a suspended listing (so suspension can't be escaped by deleting and
re-creating). The edit form renders read-only status with an explanation banner.

---

### 2. Infinite redirect loop for a suspended user
**S** 🔴 · `src/proxy.ts`, `src/lib/auth/session.ts`, `src/app/login/page.tsx`

`proxy.ts` redirected anyone holding a *cryptographically valid* JWT away from
`/login`, while page guards rejected anyone whose **account status** was no longer
active. A user suspended mid-session bounced `/dashboard → /login → /dashboard …`
until the browser gave up with "too many redirects" — with no way to sign out.

*Repro (before):* `curl -L --max-redirs 6` on `/dashboard` exhausted all 6 redirects.

**Fix** — the proxy no longer redirects away from auth pages at all; that decision
moved to the pages themselves via `redirectIfSignedIn()`, which uses the same
database-backed check as every other guard. A suspended user now lands on the login
form and gets the real reason ("This account has been suspended"). Verified: 1
redirect, ends on `/login`.

---

### 3. An empty query parameter silently hid every "on LOI" listing
**S** 🔴 · `src/lib/query.ts`, `src/lib/validation.ts`

`searchParamsToObject` mapped a present-but-empty param to `""`, and
`z.coerce.number()` turns `""` into `0`. So `/listings?priceMin=` became
`priceMin >= 0`, which excludes rows where `asking_price IS NULL` — i.e. every
listing priced "on LOI" vanished with no visible filter applied.

*Repro (before):* `/api/assets?perPage=48` → 14 · `/api/assets?perPage=48&priceMin=` → 12.

**Fix** — `searchParamsToObject` and `toURLSearchParams` now drop empty values
entirely, and every numeric schema goes through a `preprocess` that maps blank
strings to `null` before coercion. Both requests now return 14.

---

## 🟠 Significant

### 4. Buyers who specified nothing scored ~55% and outranked real mandates
**S** 🟠 · `src/lib/match.ts`, `src/lib/repo.ts`, `src/app/listings/[slug]/page.tsx`

`mandateIsUsable()` existed but was only consulted on the listings query. Every
other Smart Match surface scored an empty mandate as "neutral" on each axis, which
lands around 55%. Consequences: the buyer dashboard showed "Recommended for you"
with fabricated percentages to someone who had filled in nothing, and — worse — in
the seller's "matching buyers" list a buyer with a blank mandate (Kira Blum, 53%)
ranked **above** buyers with specific, genuinely non-matching mandates.

*Repro (before):* `Finn 85 · Jack 64 · Kira 53 · Greta 49 · Hugo 49 · Inês 28`.

**Fix** — one gate, `matchAssetForMandate()`, returns `null` for an absent or
unusable mandate, and every surface uses it. `recommendAssetsForBuyer` returns an
empty list with `mandateUsable: false`; `matchingBuyersForAsset` drops such buyers
entirely. Now: `Finn 100 · Greta 64 · Jack 56 · Inês 43 · Hugo 42`, no Kira.

### 5. Numeric inputs silently corrupted data
**S** 🟠 · `src/components/asset-form.tsx`

`num()` checked the *raw* string for emptiness but parsed the *digit-stripped*
one, so `"abc"` → `Number("")` → **0**, and `"1.5m"` → `Number("15")` → **15**.
Typing a price as "1.5m" saved an asking price of €15.

**Fix** — a single `parseNumber()` strips non-digits first and returns `null` when
nothing remains. Price and year are held as text state and parsed once on submit,
so what you type is what gets validated.

### 6. Seller suspension was a one-way door
**S** 🟠 · `src/lib/repo.ts`

`adminSetUserStatus` mutated the seller's listings to `suspended`. Reactivating the
seller did **not** restore them, and (because of bug #1) the seller could not fix it
either — the listings were stranded.

**Fix** — removed the mutation. Visibility is now derived: the public asset query
joins the seller with `status = 'active' (required)`, and `assetIsPubliclyVisible()`
guards the detail page. Suspending hides the listings, reactivating brings them
back, and nothing is destructively rewritten. Verified: 14 → 12 → 14.

### 7. Open redirect via the `next` login parameter
**S** 🟠 · `src/app/login/login-form.tsx`

`router.push(params.get("next"))` accepted any value, so
`/login?next=https://evil.example` sent the user off-site after a successful login.

**Fix** — `safeNext()` accepts only same-origin paths (must start with `/`, must not
start with `//`); otherwise the user lands on the role-appropriate home.

### 8. Writes performed during Server Component render
**S** 🟠 · `src/app/listings/[slug]/page.tsx`, `src/app/inbox/[id]/page.tsx`

`incrementAssetViews()` and `markConversationRead()` ran inline in the render
function, so every render — including router prefetches and RSC refetches — wrote to
the database. View counts inflated on their own and a GET was not idempotent.

**Fix** — both moved into `after()` from `next/server`, so they run after the
response is sent and never block or duplicate the render.

### 9. Database constraint violations surfaced as 500s
**S** 🟠 · `src/lib/http.ts`

A duplicate email or a slug collision raised a raw Sequelize error and the generic
handler answered `500 Internal server error` — indistinguishable from a real crash.

**Fix** — `handle()` now maps `UniqueConstraintError` → `409`, Sequelize
`ValidationError` → `400` with the field messages, and any other `BaseError` → `503`.
Also migrated off Zod v4's deprecated `err.flatten()` to `flattenError(err)`.

### 10. Cookie lifetime was hardcoded, independent of the token
**S** 🟠 · `src/lib/auth/jwt.ts`, `src/lib/auth/session.ts`, `src/lib/auth/constants.ts`

The session cookie was always `maxAge = 7 days` while the JWT honoured
`JWT_EXPIRES_IN`. Setting `JWT_EXPIRES_IN=1h` produced a browser that believed it
was signed in for a week against a token that died after an hour.

**Fix** — `signAccessToken()` returns `{ token, maxAgeSeconds }` derived from the
signed token's own `exp` claim; the cookie uses that. The now-redundant
`SESSION_MAX_AGE` constant is gone. Covered by a test.

---

## 🟡 Minor / correctness

| # | Issue | Fix |
|---|---|---|
| 11 | `ticketMin > ticketMax` was accepted, making the ticket axis permanently unmatchable | `.refine()` on `buyerProfileSchema` rejects it |
| 12 | `matchAsset` could divide by `Infinity` and yield `NaN` when only a lower ticket bound was set | explicit `Number.isFinite` guard + regression test |
| 13 | `ticketScore` returned 0.4 for an "on LOI" price even when the buyer set no ticket range | the "no range" branch is now evaluated first |
| 14 | "Business not active" was pushed into `reasons`, so a warning was rendered as a ✓ reason for the match | `MatchResult` gained a separate `caveats` list, rendered with a `!` marker |
| 15 | Jurisdiction comparison did not trim, so `" Lithuania"` never matched | `.trim().toLowerCase()` on both sides + test |
| 16 | `capitalize` was applied to every fact value, rendering "Bank **O**f Lithuania" | removed; only the business-status field is label-mapped |
| 17 | Admin lists were hard-capped at 48 rows with no pagination and no indication of truncation | real pagination (20/page) on all three admin tabs |
| 18 | Admin search box had no submit affordance | explicit Search button + `aria-label` |
| 19 | `startConversation` accepted an `assetId` for a draft/suspended asset | non-published assets are rejected unless the actor owns them |
| 20 | `startConversation` did not check the counterpart's role, so a buyer could open a "buyer↔buyer" thread by id | explicit role-pair check |
| 21 | Country was free text while the filter list was a hardcoded constant, so seller-entered countries were unfilterable | filter options now come from `listAssetCountries()` (distinct published countries), the form offers a `datalist`, and any actively-selected country stays visible |
| 22 | `serializeConversation` exposed `role`, which read as the counterpart's role but was the *viewer's* | renamed to `viewerRole`; counterpart now also carries `active` |
| 23 | Missing timestamps silently serialised as `1970-01-01` | `iso()` returns `null`; required timestamps use a separate helper |
| 24 | Deleting a listing had no confirmation step | two-step inline confirm (no blocking `confirm()` dialog) |

---

## ⚪ Dead code and unreachable surface

| # | What | Action |
|---|---|---|
| 25 | `toQueryString()` in `lib/query.ts` — zero callers | deleted |
| 26 | `sequelize()` in `lib/db/index.ts` — zero callers | deleted |
| 27 | `titleCase()`, `formatDate()` in `lib/format.ts` — zero callers | deleted |
| 28 | `ConversationDTO` type — zero references | deleted |
| 29 | `listAssets(opts.sellerId)` — a parameter no caller ever passed | deleted |
| 30 | `SESSION_MAX_AGE` — superseded by the token-derived lifetime | deleted |
| 31 | `MAX_AGE` alias in `session.ts` — pointless indirection | deleted |
| 32 | `DELETE /api/assets/:id` — implemented but no UI could reach it | wired up as "Delete listing" on the edit form |
| 33 | **`GET`/`PUT /api/me/seller-profile` — implemented, but sellers had no profile page at all.** A seller's company name was fixed at registration and could never be edited | `/profile` is now role-aware: buyers edit their mandate, sellers edit their company profile; added to the seller nav |
| 34 | `Sequelize` parameter unused in the migration's `down()` | removed |
| 35 | Proxy ran JWT verification on **every** public page request | matcher narrowed to the six protected prefixes only |

---

## Documentation

- `README.md` — corrected the demo-account table (canonical one-per-role logins),
  the moderation description (now derived, not cascaded), and the "what I'd improve"
  list; removed claims that no longer matched the code.
- Per the review request, explanatory comments were removed from the source. The
  reasoning that lived in them is preserved here and in `README.md`.

## Seeds

Canonical, obvious logins now exist for each role — `buyer@n5deal.test`,
`seller@n5deal.test`, `manager@n5deal.test` (password `Password123!`) — surfaced as
one-click buttons on the sign-in screen. The additional named accounts (four
sellers, six buyers with distinct mandates, one suspended seller) are kept so that
filtering, ranking and moderation have realistic data to work against.

## Verification

```
tsc --noEmit      clean
eslint .          clean
vitest run        42 passed (was 22)
next build        clean
```

New regression tests cover: empty-mandate gating, ticket-range `NaN`, jurisdiction
trimming, caveats vs reasons, blank-to-null coercion, seller status escalation,
ticket min/max ordering, token-derived cookie lifetime, issuer rejection, and
empty-query-param handling.
