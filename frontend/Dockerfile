FROM node:22-alpine AS builder
WORKDIR /app

# Build arguments (deze komen uit je GitHub Secrets)
ARG VITE_ENTRA_CLIENT_ID
ARG VITE_ENTRA_TENANT_ID
ARG VITE_AUTH_REDIRECT_URI
ARG VITE_DIRECTUS_URL
ARG VITE_EMAIL_API_ENDPOINT
ARG VITE_DIRECTUS_API_KEY

# Zet ze om naar Next.js environment variabelen voor het build process
ENV NEXT_PUBLIC_ENTRA_CLIENT_ID=$VITE_ENTRA_CLIENT_ID
ENV NEXT_PUBLIC_ENTRA_TENANT_ID=$VITE_ENTRA_TENANT_ID
ENV NEXT_PUBLIC_AUTH_REDIRECT_URI=$VITE_AUTH_REDIRECT_URI
ENV NEXT_PUBLIC_DIRECTUS_URL=$VITE_DIRECTUS_URL
ENV NEXT_PUBLIC_EMAIL_API_ENDPOINT=$VITE_EMAIL_API_ENDPOINT
ENV NEXT_PUBLIC_DIRECTUS_API_KEY=$VITE_DIRECTUS_API_KEY

# Next.js telemetry uitschakelen
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
# Gebruik 'npm ci' voor snellere, consistente installs in CI
RUN npm ci
COPY . .
# Start de productie build (Next.js standalone output)
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Kopieer alleen de benodigde bestanden voor Next.js standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]