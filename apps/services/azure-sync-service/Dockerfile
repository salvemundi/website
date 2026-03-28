# 1. Base Stage
FROM node:22.22.2-alpine AS base
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

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# Step 1: Build Shared Logic (packages/validations)
COPY packages/validations ./packages/validations
RUN pnpm --filter=@salvemundi/validations build

# Step 2: Build Specific Service (apps/services/azure-sync-service)
COPY apps/services/azure-sync-service ./apps/services/azure-sync-service
RUN pnpm --filter=@salvemundi/azure-sync-service build

# Step 3: Prune for production
RUN pnpm deploy --filter=@salvemundi/azure-sync-service --prod /app/pruned

# 3. Runner Stage
FROM node:22.22.2-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the pruned service (includes production node_modules from workspace)
COPY --from=builder --chown=node:node /app/pruned ./
# Copy the compiled output
COPY --from=builder --chown=node:node /app/apps/services/azure-sync-service/dist ./dist

USER node

EXPOSE 3002
# Command points to the flattened dist directory
CMD ["node", "dist/server.js"]
