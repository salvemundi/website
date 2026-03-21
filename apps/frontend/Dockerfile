# 1. Base Stage
FROM node:22.14.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# 2. Builder Stage
FROM base AS builder
# Copy only necessary files for installation to leverage cache
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/services/finance-service/package.json ./apps/services/finance-service/
COPY apps/services/azure-sync-service/package.json ./apps/services/azure-sync-service/
COPY apps/services/mail-service/package.json ./apps/services/mail-service/
COPY packages/validations/package.json ./packages/validations/

# Install dependencies (including devDeps)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# Build shared validations first
COPY packages/validations ./packages/validations
RUN pnpm --filter=@salvemundi/validations build

ENV BETTER_AUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

# Build the frontend
COPY apps/frontend ./apps/frontend
RUN pnpm --filter=@salvemundi/frontend build

# 3. Runner Stage
FROM node:22.14.0-alpine AS runner
WORKDIR /app
RUN chown node:node /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output from builder
# Next.js standalone includes all necessary node_modules (including workspace dependencies)
# Ensure public directory exists before copying to avoid build failure
RUN mkdir -p apps/frontend/public && chown -R node:node apps/frontend/public
COPY --from=builder --chown=node:node /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER node

EXPOSE 3000
ENV PORT=3000

# Next.js standalone entry point
CMD ["node", "apps/frontend/server.js"]
