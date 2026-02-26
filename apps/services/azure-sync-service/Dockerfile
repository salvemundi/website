# 1. Base Stage
FROM node:22.14.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# 2. Builder Stage
FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/services/azure-sync-service/package.json ./apps/services/azure-sync-service/
COPY packages/validations/package.json ./packages/validations/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build --filter=@salvemundi/azure-sync-service

# 3. Runner Stage
FROM node:22.14.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/services/azure-sync-service/package.json ./apps/services/azure-sync-service/
COPY --from=builder /app/apps/services/azure-sync-service/dist ./apps/services/azure-sync-service/dist

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --no-frozen-lockfile

EXPOSE 3002
CMD ["node", "apps/services/azure-sync-service/dist/server.js"]
