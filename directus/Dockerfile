# Gebruik de officiële Directus basis-image
FROM directus/directus:latest

# Stap 1: Voorbereiding
USER root
RUN corepack enable

# Stap 2: Kopieer de extensie naar een tijdelijke map voor de build
COPY --chown=node:node ./directus-extension-entra-auth /tmp/directus-extension-entra-auth

# Stap 3: Build proces
WORKDIR /tmp/directus-extension-entra-auth
# Installeer dev-dependencies (om te kunnen builden)
RUN npm install --include=dev
# Build de extensie (maakt dist/ map aan)
RUN npm run build
# Verwijder dev-dependencies (alleen productie overhouden)
RUN npm prune --production

# Stap 4: Installatie in Directus extensions map
WORKDIR /directus
# Maak de doelmap
RUN mkdir -p /directus/extensions/endpoints/directus-extension-entra-auth
# Kopieer package.json, dist/ en node_modules (productie deps)
RUN cp -r /tmp/directus-extension-entra-auth/package.json /directus/extensions/endpoints/directus-extension-entra-auth/ && \
    cp -r /tmp/directus-extension-entra-auth/dist /directus/extensions/endpoints/directus-extension-entra-auth/ && \
    cp -r /tmp/directus-extension-entra-auth/node_modules /directus/extensions/endpoints/directus-extension-entra-auth/

# Stap 5: Clean-up en Rechten
RUN rm -rf /tmp/directus-extension-entra-auth && \
    chown -R node:node /directus/extensions

USER node