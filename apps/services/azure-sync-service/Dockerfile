# 1. Base Stage
FROM node:22.14.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# 2. Builder Stage
FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/services/azure-sync-service/package.json apps/services/azure-sync-service/tsconfig.json ./apps/services/azure-sync-service/
COPY packages/validations/package.json packages/validations/tsconfig.json ./packages/validations/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm --filter=@salvemundi/azure-sync-service build
RUN pnpm deploy --filter=@salvemundi/azure-sync-service --prod /app/pruned

# 3. Runner Stage
FROM node:22.14.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the pruned service (includes production node_modules from workspace)
COPY --from=builder /app/pruned ./
# Copy the compiled output
COPY --from=builder /app/apps/services/azure-sync-service/dist ./dist

EXPOSE 3002
# Command points to the flattened dist directory
CMD ["node", "dist/server.js"]
