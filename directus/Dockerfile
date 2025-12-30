# Gebruik de officiële Directus basis-image
# Directus CMS
# Environment Isolation Audit: 2025-12-30
FROM directus/directus:11.1.1

# Stap 1: Voorbereiding
USER root
RUN corepack enable

# Stap 2: Kopieer de extensie DIRECT naar de root extensions map
# Dit vervangt de 'endpoints' submap, wat soms discovery issues geeft
WORKDIR /directus/extensions/directus-extension-entra-auth
COPY --chown=node:node ./directus-extension-entra-auth .

# Stap 3: Build en Installatie (In-Place)
# Verwijder node_modules om zeker te zijn van een schone installatie
RUN rm -rf node_modules dist

# Installeer dependencies (inclusief dev voor de build)
RUN npm install --include=dev

# Draai de build (genereert dist/ van src/)
RUN npm run build

# Schoonmaak: verwijder dev dependencies
RUN npm prune --production

# Stap 4: Herstel Rechten (Critical step)
WORKDIR /directus
RUN chown -R node:node /directus/extensions

# Debug: Laat zien wat er precies aanwezig is (verschijnt in build logs)
# Dit helpt ons bevestigen dat de files op de juiste plek staan
RUN echo "--- Extension Directory Contents (ROOT) ---" && \
    ls -la /directus/extensions/directus-extension-entra-auth && \
    echo "--- Dist Directory Contents ---" && \
    ls -la /directus/extensions/directus-extension-entra-auth/dist || echo "No dist folder found"

USER node