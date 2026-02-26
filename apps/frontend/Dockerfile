# 1. Base Stage
FROM node:22.14.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# 2. Prune Stage
FROM base AS pruner
COPY . .
RUN pnpm deploy --filter=@salvemundi/frontend --prod /pruned

# 3. Build Stage
FROM pruner AS builder
WORKDIR /pruned
# Mount cache to prevent redownloading unchanged packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile
RUN pnpm build

# 4. Runner Stage (Production)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output from builder
# Next.js standalone output correctly resolves workspace dependencies
COPY --from=builder /pruned/.next/standalone ./
COPY --from=builder /pruned/.next/static ./.next/static
COPY --from=builder /pruned/public ./public

EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
