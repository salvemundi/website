FROM node:26-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11.8.0
WORKDIR /app

FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY patches ./patches
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/services/finance-service/package.json ./apps/services/finance-service/
COPY apps/services/azure-sync-service/package.json ./apps/services/azure-sync-service/
COPY apps/services/mail-service/package.json ./apps/services/mail-service/
COPY apps/services/azure-management-service/package.json ./apps/services/azure-management-service/
COPY packages/validations/package.json ./packages/validations/
COPY packages/db/package.json ./packages/db/

# Tell pnpm to include linuxmusl binaries during docker install
RUN pnpm config set supportedArchitectures.libc musl && \
    pnpm config set supportedArchitectures.os linux && \
    pnpm config set supportedArchitectures.cpu x64

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

COPY packages/db ./packages/db
RUN pnpm --filter=@salvemundi/db build

COPY packages/validations ./packages/validations
RUN pnpm --filter=@salvemundi/validations build

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
    pnpm --filter=@salvemundi/frontend build

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
# Copy global node_modules so native sharp bindings are guaranteed to exist at runtime
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

RUN mkdir -p apps/frontend/.next/cache && chown -R node:node apps/frontend/.next/cache

USER node

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/frontend/server.js"]