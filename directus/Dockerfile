# Gebruik de officiële Directus basis-image
FROM directus/directus:latest

# Stap 1: Voorbereiding
USER root
RUN corepack enable

# Stap 2: Custom Extensie - Microsoft Entra ID Endpoint
COPY --chown=node:node ./directus-extension-entra-auth /tmp/directus-extension-entra-auth

# Stap 3: Installeren en Bouwen van de extensie
WORKDIR /tmp/directus-extension-entra-auth
RUN npm install --include=dev && npm run build

# Stap 4: Kopiëren naar Directus extensions map
WORKDIR /directus
RUN mkdir -p /directus/extensions/endpoints/directus-extension-entra-auth && \
    cp -r /tmp/directus-extension-entra-auth/package.json /directus/extensions/endpoints/directus-extension-entra-auth/ && \
    cp -r /tmp/directus-extension-entra-auth/index.js /directus/extensions/endpoints/directus-extension-entra-auth/ && \
    cp -r /tmp/directus-extension-entra-auth/node_modules /directus/extensions/endpoints/directus-extension-entra-auth/

# Stap 5: Clean-up en Rechten
RUN rm -rf /tmp/directus-extension-entra-auth && \
    chown -R node:node /directus/extensions

USER node