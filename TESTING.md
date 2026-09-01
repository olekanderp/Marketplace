# How to check and test this project

Everything below is copy-pasteable. Two ways to run it: **Docker** (nothing to
install) or **local dev** (faster iteration).

---

## 0. Start it

### Option A — Docker (recommended for a first look)

```bash
docker compose up --build
```

Three services start in order: `db` (postgres:16-alpine) → `migrate` (runs
migrations + seeders, then exits) → `app`. Open **http://localhost:3000**.

```bash
docker compose logs migrate     # should end with "✓ database ready"
docker compose ps               # app Up, db Up (healthy), migrate Exited (0)
docker compose down -v          # stop and wipe the volume
```

### Option B — local dev

```bash
docker run -d --name n5deal-pg -p 5433:5432 \
  -e POSTGRES_USER=n5deal -e POSTGRES_PASSWORD=n5deal -e POSTGRES_DB=n5deal \
  postgres:16-alpine

cp .env.example .env            # then set JWT_SECRET: openssl rand -base64 48
npm install
npm run db:migrate && npm run db:seed
npm run dev                     # http://localhost:3000
```

`npm run db:reset` returns the database to the exact seeded state at any time.

---

## 1. Automated checks

```bash
npm run typecheck    # tsc --noEmit          → no output = clean
npm run lint         # eslint .              → no output = clean
npm test             # vitest run            → 42 passed
npm run build        # next build            → Compiled successfully
```

`npm test` covers the Smart Match engine, JWT signing/verification, all Zod
schemas, and query-string parsing. It needs **no database** — the vitest config
supplies the environment.

**Verify migrations apply to a genuinely empty database:**

```bash
docker exec n5deal-pg psql -U n5deal -c "DROP DATABASE IF EXISTS n5deal_check;"
docker exec n5deal-pg psql -U n5deal -c "CREATE DATABASE n5deal_check;"
DATABASE_URL=postgres://n5deal:n5deal@localhost:5433/n5deal_check npm run db:migrate
DATABASE_URL=postgres://n5deal:n5deal@localhost:5433/n5deal_check npm run db:seed
```

---

## 2. Demo accounts

Password for **all** accounts: `Password123!`

| Role | Login | Notes |
|---|---|---|
| **Buyer** | `buyer@n5deal.test` | Finn Larsson — full mandate (payment/EMI, LT/DE/EE/PL, €0.5–6M) |
| **Seller** | `seller@n5deal.test` | Alex Nakamura — owns 3 listings incl. 1 draft |
| **Manager** | `manager@n5deal.test` | Morgan Platform — moderation only |

The sign-in screen has a one-click button for each of these three.

<details>
<summary>Additional accounts (for filtering / ranking / moderation scenarios)</summary>

| Login | Purpose |
|---|---|
| `bianca.seller@n5deal.test` | 2 Brazil listings — use to test seller suspension |
| `caio.seller@n5deal.test` · `dana.seller@n5deal.test` | more sellers/sectors |
| `flagged.seller@n5deal.test` | **suspended** — proves a suspended user cannot sign in |
| `greta.buyer@n5deal.test` | bank/fintech, DE/LT/CH, €2–40M |
| `hugo.buyer@n5deal.test` | crypto, LT/EE/CY |
| `ines.buyer@n5deal.test` | payment/fintech, Brazil, open lower bound |
| `jack.buyer@n5deal.test` | EMI/payment, UK only |
| `kira.buyer@n5deal.test` | **empty mandate** — proves no fake Smart Match score is shown |

</details>

Seeded data: 12 users · 17 assets (14 published, 2 draft, 1 suspended) · 6 buyer
mandates · 3 conversations · 6 messages.

---

## 3. Manual walkthrough (≈10 minutes)

### 3.1 Guest
1. Open `/` → redirects to `/listings`. 14 listings.
2. Click sector tabs (**Payment**, **EMI**, …) — the URL gains `?sector=…` and the
   result count changes.
3. **Filters** → tick a jurisdiction, set a price range, toggle **Include "on LOI"**.
4. **Reload the page.** Filters survive, because they live in the URL. Copy the URL
   into a new tab — same result set.
5. **Sort** → *Price ↑*. Priced listings ascend; "on LOI" listings sort last, not first.
6. Open any listing. The company overview is **truncated** with a "Sign in" prompt,
   and there is no contact form.

### 3.2 Buyer
1. Sign in as `buyer@n5deal.test`.
2. `/dashboard` → **Recommended for you** with *Smart match %* badges. Hover a badge
   to see the reasons.
3. Open *Lithuania EMI licence with SEPA direct participation* → **Smart match 100%**
   with three ✓ reasons (sector, jurisdiction, ticket range).
4. `/listings` now shows a match badge on every card.
5. `My mandate` → clear all sectors/jurisdictions/ticket, **Save**. Go back to
   `/dashboard`: recommendations disappear and you get "Set up your mandate" —
   **no invented percentages**. Restore the mandate afterwards (or `npm run db:reset`).
6. On a listing, write a message → **Send message** → lands in `/inbox/<id>`.
7. Reply from the thread; `/inbox` shows the latest snippet and unread badges.

### 3.3 Seller
1. Sign in as `seller@n5deal.test`.
2. `/dashboard` → your listings with status badges, plus **Buyers matching …** for
   your newest published listing.
3. **Publish an asset** → fill in only the title/sector/country and press
   **Save as draft**. **Smart validation** lists what is missing (short description,
   no highlights, no price, no regulator for a regulated sector, no year).
4. Fill it in properly and press **Publish**.
5. `Browse buyers` → filter by sector / jurisdiction / free text → open a buyer →
   **Send message**.
6. `My profile` → edit company name / about / website → **Save profile**.
7. On the edit form, **Delete listing** requires a second click to confirm.

### 3.4 Platform manager
1. Sign in as `manager@n5deal.test` → lands on `/admin`.
2. **Assets** tab → suspend a listing → open `/listings` in a private window: it is gone.
3. **Sellers** tab → suspend *Bianca Ferreira* → `/listings` drops from 14 to 12.
4. **Reactivate** her → back to 14. Moderation is reversible; nothing is rewritten.
5. Search across tabs; page through results (20 per page).

---

## 4. Regression checks for the fixed bugs

Each block reproduces a bug listed in [`BUGFIXES.md`](./BUGFIXES.md) and shows the
expected post-fix result. Run them against a freshly seeded database
(`npm run db:reset`).

```bash
B=http://localhost:3000
login() { curl -s -c "$2" -X POST $B/api/auth/login -H 'content-type: application/json' \
  -d "{\"email\":\"$1\",\"password\":\"Password123!\"}" -o /dev/null; }
login buyer@n5deal.test   b.txt
login seller@n5deal.test  s.txt
login manager@n5deal.test m.txt
AID=00000000-0000-4000-8000-000000000100   # Lithuania EMI listing
```

**#1 — a seller cannot undo moderation**

```bash
curl -s -b m.txt -X PATCH $B/api/admin/assets/$AID \
  -H 'content-type: application/json' -d '{"status":"suspended"}' >/dev/null
curl -s -b s.txt -X PATCH $B/api/assets/$AID \
  -H 'content-type: application/json' -d '{"status":"published"}'
# expect: 403 "This listing was suspended by the platform…"
curl -s -b m.txt -X PATCH $B/api/admin/assets/$AID \
  -H 'content-type: application/json' -d '{"status":"published"}' >/dev/null
```

**#2 — no redirect loop for a suspended user**

```bash
curl -s -b m.txt -X PATCH $B/api/admin/users/00000000-0000-4000-8000-000000000020 \
  -H 'content-type: application/json' -d '{"status":"suspended"}' >/dev/null
curl -s -b b.txt -o /dev/null -L --max-redirs 6 \
  -w 'redirects=%{num_redirects} final=%{url_effective}\n' $B/dashboard
# expect: redirects=1 final=…/login?next=%2Fdashboard   (before: 6, looping)
curl -s -b m.txt -X PATCH $B/api/admin/users/00000000-0000-4000-8000-000000000020 \
  -H 'content-type: application/json' -d '{"status":"active"}' >/dev/null
```

**#3 — an empty price param must not hide "on LOI" listings**

```bash
curl -s "$B/api/assets?perPage=48"            | grep -o '"total":[0-9]*'
curl -s "$B/api/assets?perPage=48&priceMin="  | grep -o '"total":[0-9]*'
# expect: both 14   (before: 14 then 12)
```

**#4 — an empty mandate produces no score**

```bash
login kira.buyer@n5deal.test k.txt
curl -s -b k.txt "$B/api/recommendations/assets"
# expect: {"mandateUsable":false,"items":[]}

curl -s -b s.txt "$B/api/assets/$AID/matching-buyers"
# expect: Kira Blum absent; buyers with real mandates ranked above non-matching ones
```

**#5 — blank numbers stay "on LOI" instead of becoming 0**

```bash
curl -s -b s.txt -X POST $B/api/assets -H 'content-type: application/json' \
  -d '{"title":"Price sanity check","sector":"emi","country":"Malta","askingPrice":"","yearIssued":""}'
# expect: "askingPrice":null,"yearIssued":null
```

**#6 — seller suspension is reversible**

```bash
BIANCA=00000000-0000-4000-8000-000000000011
curl -s "$B/api/assets?perPage=48" | grep -o '"total":[0-9]*'                       # 14
curl -s -b m.txt -X PATCH $B/api/admin/users/$BIANCA \
  -H 'content-type: application/json' -d '{"status":"suspended"}' >/dev/null
curl -s "$B/api/assets?perPage=48" | grep -o '"total":[0-9]*'                       # 12
curl -s -b m.txt -X PATCH $B/api/admin/users/$BIANCA \
  -H 'content-type: application/json' -d '{"status":"active"}' >/dev/null
curl -s "$B/api/assets?perPage=48" | grep -o '"total":[0-9]*'                       # 14
```

**#7 — no open redirect**

Open `http://localhost:3000/login?next=https://example.com` and sign in.
Expect to land on `/dashboard`, never on `example.com`.

---

## 5. Authorization matrix

Expected status per role. `401` = signed out, `403` = wrong role.

```bash
check() { printf '%-42s %s\n' "$2 $3" "$(curl -s -o /dev/null -w '%{http_code}' -b "$1" -X "${4:-GET}" "$B$3")"; }
```

| Endpoint | guest | buyer | seller | manager |
|---|---|---|---|---|
| `GET /api/assets` | 200 | 200 | 200 | 200 |
| `POST /api/assets` | 401 | 403 | 201 | 403 |
| `GET /api/buyers` | 401 | 403 | 200 | 200 |
| `GET /api/me/buyer-profile` | 401 | 200 | 403 | 403 |
| `GET /api/me/seller-profile` | 401 | 403 | 200 | 403 |
| `GET /api/recommendations/assets` | 401 | 200 | 403 | 403 |
| `GET /api/admin/users` | 401 | 403 | 403 | 200 |
| `PATCH /api/admin/assets/:id` | 401 | 403 | 403 | 200 |

Pages redirect rather than error: a signed-out visitor to `/dashboard`, `/profile`,
`/buyers`, `/assets/*`, `/inbox`, `/admin` is sent to `/login?next=…`; a role that
does not own the page is sent to its own home (`/admin` for managers, `/dashboard`
otherwise).

Also worth confirming manually:

- A suspended account cannot sign in — `flagged.seller@n5deal.test` returns
  *"This account has been suspended"*.
- You cannot register as a manager — `POST /api/auth/register` with
  `"role":"manager"` returns `400`.
- You cannot message yourself — `POST /api/conversations` with your own
  `toUserId` returns `400`.
- You cannot read someone else's thread — `GET /api/conversations/<other id>`
  returns `403`.

---

## 6. Data-integrity spot checks

```bash
docker exec n5deal-pg psql -U n5deal -d n5deal -c "
  SELECT role, status, count(*) FROM users GROUP BY 1,2 ORDER BY 1;
  SELECT status, count(*) FROM assets GROUP BY 1;
  SELECT jsonb_typeof(target_sectors) FROM buyer_profiles LIMIT 1;  -- must be 'array'
  SELECT count(*) FROM assets WHERE asking_price IS NULL;           -- the 'on LOI' rows
"
```

Re-running `npm run db:seed` must be a no-op ("No seeders found" — seeders are
tracked in `sequelize_seeds`), which is what makes the Docker `migrate` service safe
to run on every `docker compose up`.

---

## 7. What is intentionally not covered

- No end-to-end browser suite (Playwright) — the UI was verified manually and in a
  real browser; automated coverage stops at the unit level.
- No load or performance testing.
- No rate limiting or CSRF tokens; the session cookie relies on `SameSite=Lax`.
- The market-trend sparkline is deterministic decoration derived from the slug, not
  real pricing data.
