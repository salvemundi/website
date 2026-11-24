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

RUN --mount=type=cache,id=bun,target=/bun-cache bun install --production --frozen-lockfile --filter=@salvemundi/mcp-service...

COPY apps/services/mcp-service ./apps/services/mcp-service
RUN bun run --filter=@salvemundi/mcp-service build

FROM oven/bun:1.4.5-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder --chown=bun:bun /app/apps/services/mcp-service/dist ./dist

USER bun

EXPOSE 3005
CMD ["bun", "dist/server.js"]
