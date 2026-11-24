FROM oven/bun:1.4.5-alpine AS base
ENV BUN_INSTALL_CACHE_DIR="/bun-cache"
WORKDIR /app

FROM base AS builder
COPY bun.lock bunfig.toml package.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/services/finance-service/package.json ./apps/services/finance-service/
COPY apps/services/azure-sync-service/package.json ./apps/services/azure-sync-service/
COPY apps/services/mail-service/package.json ./apps/services/mail-service/
COPY apps/services/azure-management-service/package.json ./apps/services/azure-management-service/
COPY apps/services/mcp-service/package.json ./apps/services/mcp-service/
COPY apps/services/mobile-notification-service/package.json ./apps/services/mobile-notification-service/
COPY apps/services/monitoring-service/package.json ./apps/services/monitoring-service/
COPY packages/validations/package.json ./packages/validations/
COPY packages/db/package.json ./packages/db/

# TODO: use proper bun build
RUN --mount=type=cache,id=bun,target=/bun-cache bun install --production --frozen-lockfile --filter=@salvemundi/azure-sync-service...

COPY packages/db ./packages/db
COPY packages/validations ./packages/validations
COPY apps/services/azure-sync-service ./apps/services/azure-sync-service

FROM oven/bun:1.4.5-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache tzdata
ENV TZ=Europe/Amsterdam

COPY --from=builder --chown=bun:bun /app ./
WORKDIR /app/apps/services/azure-sync-service

USER bun

EXPOSE 3002
CMD ["bun", "src/server.ts"]