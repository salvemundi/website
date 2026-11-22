FROM oven/bun:1.4.5-alpine AS bun-bin

FROM node:26-alpine AS base
RUN apk add --no-cache libstdc++ libgcc
COPY --from=bun-bin /usr/local/bin/bun /usr/local/bin/bun
COPY --from=bun-bin /usr/local/bin/bunx /usr/local/bin/bunx
ENV BUN_INSTALL_CACHE_DIR="/bun-cache"
WORKDIR /app

FROM base AS manifests
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

FROM manifests AS prod-deps
RUN --mount=type=cache,id=bun,target=/bun-cache bun install --production --frozen-lockfile --filter=@salvemundi/frontend...

FROM manifests AS builder
RUN --mount=type=cache,id=bun,target=/bun-cache bun install --frozen-lockfile --filter=@salvemundi/frontend...

COPY packages/db ./packages/db
COPY packages/validations ./packages/validations

COPY apps/frontend ./apps/frontend
RUN BETTER_AUTH_SECRET=dummy_secret_at_least_32_characters_long_v7_salve_mundi \
    BETTER_AUTH_URL=http://localhost:3000 \
    NEXT_PUBLIC_APP_URL=http://localhost:3000 \
    PUBLIC_URL=http://localhost:3000 \
    INTERNAL_DIRECTUS_URL=http://localhost:8055 \
    DIRECTUS_SERVICE_URL=http://localhost:8055 \
    DIRECTUS_STATIC_TOKEN=dummy_token \
    DB_USER=dummy \
    DB_PASSWORD=dummy \
    DB_PORT=0000 \
    DB_NAME=dummy \
    DB_HOST=localhost \
    bun run --filter=@salvemundi/frontend build

FROM node:26-alpine AS runner
WORKDIR /app
RUN chown node:node /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache tzdata vips
ENV TZ=Europe/Amsterdam

RUN mkdir -p apps/frontend/public && chown -R node:node apps/frontend/public
COPY --from=builder --chown=node:node /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static
# Copy production node_modules (without devDependencies) so native sharp bindings exist at runtime
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
RUN ln -sfn /app/node_modules/.bun/node_modules/sharp apps/frontend/node_modules/sharp && chown -h node:node apps/frontend/node_modules/sharp

RUN mkdir -p apps/frontend/.next/cache && chown -R node:node apps/frontend/.next/cache

USER node

# Exercise the native binding and bundled libvips in the final runtime image.
# Loading sharp during next build alone does not validate this stage.
RUN node -e "const sharp = require('./apps/frontend/node_modules/sharp'); sharp({ create: { width: 1, height: 1, channels: 4, background: '#00000000' } }).png().toBuffer().then(() => console.log('Sharp runtime smoke test passed'), error => { console.error(error); process.exit(1); });"

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/frontend/server.js"]
