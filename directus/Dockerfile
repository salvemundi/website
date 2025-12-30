# Gebruik de officiële Directus basis-image
FROM directus/directus:latest

# Stap 1: Voorbereiding
USER root
RUN corepack enable

# Stap 2: Custom Extensie - Microsoft Entra ID Endpoint (Raw Source)
# We kopiëren de extensie direct naar de definitieve plek voor runtime loading.
COPY --chown=node:node ./directus-extension-entra-auth /directus/extensions/endpoints/directus-extension-entra-auth

# Stap 3: Installeer afhankelijkheden in de container
WORKDIR /directus/extensions/endpoints/directus-extension-entra-auth
RUN npm install --production

# Stap 4: Herstel Rechten
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node