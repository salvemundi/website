FROM oven/bun:1.4.5-alpine AS deps
ENV BUN_INSTALL_CACHE_DIR="/bun-cache"
WORKDIR /app
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

RUN --mount=type=cache,id=bun,target=/bun-cache bun install --production --frozen-lockfile --filter=@salvemundi/azure-sync-service...

FROM oven/bun:1.4.5-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache tzdata
ENV TZ=Europe/Amsterdam

COPY --from=deps --chown=bun:bun /app/package.json ./package.json
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=deps --chown=bun:bun /app/packages/db/package.json ./packages/db/package.json
COPY --from=deps --chown=bun:bun /app/packages/db/node_modules ./packages/db/node_modules
COPY --chown=bun:bun packages/db/src ./packages/db/src
COPY --chown=bun:bun packages/db/drizzle ./packages/db/drizzle
COPY --from=deps --chown=bun:bun /app/packages/validations/package.json ./packages/validations/package.json
COPY --from=deps --chown=bun:bun /app/packages/validations/node_modules ./packages/validations/node_modules
COPY --chown=bun:bun packages/validations/src ./packages/validations/src
COPY --from=deps --chown=bun:bun /app/apps/services/azure-sync-service/package.json ./apps/services/azure-sync-service/package.json
COPY --from=deps --chown=bun:bun /app/apps/services/azure-sync-service/node_modules ./apps/services/azure-sync-service/node_modules
COPY --chown=bun:bun apps/services/azure-sync-service/src ./apps/services/azure-sync-service/src

WORKDIR /app/apps/services/azure-sync-service
USER bun

EXPOSE 3002
CMD ["bun", "src/server.ts"]
