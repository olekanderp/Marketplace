# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# Base — Alpine Node
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ─────────────────────────────────────────────────────────────────────────────
# Install all dependencies (needed to build)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Production-only dependencies (used by both the migrator and the runner)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS proddeps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# Build the Next.js app
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Migrator — runs migrations + seeders, then exits (see docker-compose.yml)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS migrator
ENV NODE_ENV=production
COPY --from=proddeps /app/node_modules ./node_modules
COPY package.json .sequelizerc ./
COPY config ./config
COPY db ./db
COPY scripts ./scripts
CMD ["sh", "scripts/migrate-and-seed.sh"]

# ─────────────────────────────────────────────────────────────────────────────
# Runner — `next start`, non-root
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=proddeps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --chown=nextjs:nodejs package.json next.config.ts ./

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
