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

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

COPY packages/db ./packages/db
RUN pnpm --filter=@salvemundi/db build

COPY packages/validations ./packages/validations
RUN pnpm --filter=@salvemundi/validations build

COPY apps/services/azure-sync-service ./apps/services/azure-sync-service
RUN pnpm --filter=@salvemundi/azure-sync-service build

RUN pnpm deploy --filter=@salvemundi/azure-sync-service --prod --legacy /app/pruned

FROM node:26-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache tzdata
ENV TZ=Europe/Amsterdam

COPY --from=builder --chown=node:node /app/pruned ./
COPY --from=builder --chown=node:node /app/apps/services/azure-sync-service/dist ./dist

USER node

EXPOSE 3002
CMD ["node", "dist/server.js"]