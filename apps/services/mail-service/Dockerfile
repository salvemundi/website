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
