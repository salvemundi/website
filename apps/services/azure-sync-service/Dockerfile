# 1. Base Stage
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# 2. Prune Stage
FROM base AS pruner
COPY . .
RUN pnpm deploy --filter=@salvemundi/azure-sync-service --prod /pruned

# 3. Build Stage
FROM pruner AS builder
WORKDIR /pruned
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm build

# 4. Runner Stage (Production)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /pruned/package.json ./
COPY --from=builder /pruned/node_modules ./node_modules
COPY --from=builder /pruned/dist ./dist

EXPOSE 3002
CMD ["node", "dist/server.js"]
