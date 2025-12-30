# Gebruik de officiële Directus basis-image
FROM directus/directus:latest

# Stap 1: Voorbereiding
USER root
RUN corepack enable

# Stap 2: Kopieer de extensie DIRECT naar de eindbestemming
# Dit voorkomt verwarring met tmp mappen en copy-errors
WORKDIR /directus/extensions/endpoints/directus-extension-entra-auth
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
RUN echo "--- Extension Directory Contents ---" && \
    ls -la /directus/extensions/endpoints/directus-extension-entra-auth && \
    echo "--- Dist Directory Contents ---" && \
    ls -la /directus/extensions/endpoints/directus-extension-entra-auth/dist || echo "No dist folder found"

USER node