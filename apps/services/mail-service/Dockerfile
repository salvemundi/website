# 1. Base Stage
FROM node:22.14.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# 2. Builder Stage
FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/services/mail-service/package.json apps/services/mail-service/tsconfig.json ./apps/services/mail-service/
COPY packages/validations/package.json packages/validations/tsconfig.json ./packages/validations/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm --filter=@salvemundi/mail-service build

# 3. Runner Stage
FROM node:22.14.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/services/mail-service/package.json ./apps/services/mail-service/
COPY --from=builder /app/apps/services/mail-service/dist ./apps/services/mail-service/dist

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --no-frozen-lockfile

EXPOSE 3003
CMD ["node", "apps/services/mail-service/dist/server.js"]
