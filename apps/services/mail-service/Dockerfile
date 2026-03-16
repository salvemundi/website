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

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# Step 1: Build Shared Logic (packages/validations)
COPY packages/validations ./packages/validations
RUN pnpm --filter=@salvemundi/validations build

# Step 2: Build Specific Service (apps/services/mail-service)
# Copying only this service ensures a change in another service doesn't invalidate this build
COPY apps/services/mail-service ./apps/services/mail-service
RUN pnpm --filter=@salvemundi/mail-service build

# Step 3: Prune for production
RUN pnpm deploy --filter=@salvemundi/mail-service --prod /app/pruned

# 3. Runner Stage
FROM node:22.14.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the pruned service (includes production node_modules from workspace)
COPY --from=builder /app/pruned ./
# Copy the compiled output
COPY --from=builder /app/apps/services/mail-service/dist ./dist

EXPOSE 3003
# Command points to the flattened dist directory
CMD ["node", "dist/server.js"]
