# syntax=docker/dockerfile:1.7
# Markala Web — Next.js 14 production multi-stage build (pnpm monorepo)
# Build: docker build -f apps/web/Dockerfile -t markala-web:latest .
# Run:   docker run -p 3000:3000 markala-web

# ── 1. Base — pnpm + node 20
FROM node:26-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ── 2. Deps — install all workspace dependencies (cache layer)
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/config/package.json ./packages/config/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── 3. Builder — copy source & build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/web ./apps/web
# NEXT_PUBLIC_* değişkenleri BUILD-TIME'da bundle'a gömülür — runtime env çok geç.
# Bunlar build-arg olarak gelmezse: storefront API'ye ulaşamaz (login/kayıt kırılır),
# GA4/analytics yüklenmez. API_URL'e güvenli default verildi; diğerleri CI/compose'tan gelir.
ARG NEXT_PUBLIC_API_URL=https://api.markala.com.tr
ARG NEXT_PUBLIC_GA4_ID=
ARG NEXT_PUBLIC_CLARITY_ID=
ARG NEXT_PUBLIC_GTM_ID=
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
ARG NEXT_PUBLIC_BING_VERIFICATION=
ARG NEXT_PUBLIC_YANDEX_VERIFICATION=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_GA4_ID=$NEXT_PUBLIC_GA4_ID \
    NEXT_PUBLIC_CLARITY_ID=$NEXT_PUBLIC_CLARITY_ID \
    NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION \
    NEXT_PUBLIC_BING_VERIFICATION=$NEXT_PUBLIC_BING_VERIFICATION \
    NEXT_PUBLIC_YANDEX_VERIFICATION=$NEXT_PUBLIC_YANDEX_VERIFICATION
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# NEXT_PUBLIC_API_URL build-time'da inline edilmeli (client bundle storefront auth için API'yi çağırır)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm --filter @markala/web build

# ── 4. Runtime — minimal image (Next.js standalone)
FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user (security)
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Standalone output: minimal node_modules + .next/standalone server
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

# Health check (used by docker-compose + orchestrator)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
