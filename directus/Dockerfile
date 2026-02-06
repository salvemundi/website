FROM directus/directus:11.1.1

# Environment Isolation Audit: 2026-02-07 (Session Fix Re-run)

# Kopieer onze custom extensie
WORKDIR /directus/extensions/directus-extension-entra-auth
COPY --chown=node:node ./directus-extension-entra-auth .

# Build de extensie (omdat we in een nieuwe container zitten)
RUN npm install --include=dev && \
    npm run build && \
    npm prune --production

# Terug naar root voor verdere acties
WORKDIR /directus

# Fix permissies (Directus draait als 'node' user)
RUN chown -R node:node /directus/extensions

# Zorg dat PM2 de juiste permissies heeft voor de node user
RUN mkdir -p /home/node/.pm2 && \
    chown -R node:node /home/node/.pm2

# Debug: check of de extensie er staat
RUN echo "--- Extension Directory Contents (ROOT) ---" && \
    ls -la /directus/extensions/directus-extension-entra-auth && \
    echo "--- Dist Directory Contents ---" && \
    ls -la /directus/extensions/directus-extension-entra-auth/dist || echo "No dist folder found"

# Stap 6: Install curl for healthchecks (Directus is Alpine based)
USER root
RUN apk add --no-cache curl

# Healthcheck om de deployment script te laten weten dat we klaar zijn
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=60s \
  CMD curl -s -f http://localhost:8055/server/ping || exit 1

USER node