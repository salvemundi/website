# 1. Base Stage
FROM node:22.14.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# 2. Builder Stage
FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/services/azure-management-service/package.json apps/services/azure-management-service/tsconfig.json ./apps/services/azure-management-service/
COPY packages/validations/package.json packages/validations/tsconfig.json ./packages/validations/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# Step 1: Build Shared Logic (packages/validations)
COPY packages/validations ./packages/validations
RUN pnpm --filter=@salvemundi/validations build

# Step 2: Build Specific Service (apps/services/azure-management-service)
COPY apps/services/azure-management-service ./apps/services/azure-management-service
RUN pnpm --filter=@salvemundi/azure-management-service build

RUN pnpm deploy --filter=@salvemundi/azure-management-service --prod /app/pruned

# 3. Runner Stage
FROM node:22.14.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the pruned service (includes production node_modules from workspace)
COPY --from=builder --chown=node:node /app/pruned ./
# Copy the compiled output
COPY --from=builder --chown=node:node /app/apps/services/azure-management-service/dist ./dist

USER node

EXPOSE 3004
# Command points to the flattened dist directory
CMD ["node", "dist/server.js"]
