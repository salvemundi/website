FROM node:26-alpine AS base
ENV BUN_INSTALL_CACHE_DIR="/bun-cache"
RUN npm install -g bun@1.4.5
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

RUN --mount=type=cache,id=bun,target=/bun-cache bun install --frozen-lockfile --filter=@salvemundi/azure-sync-service...

COPY packages/db ./packages/db
RUN bun run --filter=@salvemundi/db build

COPY packages/validations ./packages/validations
RUN bun run --filter=@salvemundi/validations build

COPY apps/services/azure-sync-service ./apps/services/azure-sync-service
RUN bun run --filter=@salvemundi/azure-sync-service build

# Reinstall with production dependencies only (bun has no `pnpm deploy`)
RUN --mount=type=cache,id=bun,target=/bun-cache find . -name node_modules -prune -exec rm -rf {} + && bun install --production --frozen-lockfile --filter=@salvemundi/azure-sync-service...

FROM node:26-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache tzdata
ENV TZ=Europe/Amsterdam

COPY --from=builder --chown=node:node /app ./
WORKDIR /app/apps/services/azure-sync-service

USER node

EXPOSE 3002
CMD ["node", "dist/server.js"]