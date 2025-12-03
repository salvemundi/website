# Gebruik de officiële Directus basis-image
FROM directus/directus:latest

# Stap 1: Voorbereiding op pnpm installaties
USER root
RUN corepack enable
USER node

# Stap 2: Custom Extensie - Microsoft Entra ID Endpoint
COPY --chown=node:node ./directus-extension-entra-auth /tmp/directus-extension-entra-auth

# Ga naar de map van de custom extensie om afhankelijkheden te installeren
WORKDIR /tmp/directus-extension-entra-auth
RUN pnpm install

# Stap 3: Fix module loading path (Oplossen van ROUTE_NOT_FOUND)
# Verplaats index.js naar de root van de extensiemap en update package.json
# FIX: We gebruiken # als delimiter in plaats van / om conflicten te voorkomen
RUN mv src/index.js index.js && \
    sed -i 's#"src/index.js"#"index.js"#g' package.json

# Stap 4: Kopiëren van Inhoud en Clean-up (Robuuste Methode)
WORKDIR /directus 

# 1. Maak de definitieve doelmap
RUN mkdir -p /directus/extensions/endpoints/directus-extension-entra-auth

# 2. Kopieer alle inhoud (inclusief node_modules en de nieuwe index.js)
RUN cp -a /tmp/directus-extension-entra-auth/. /directus/extensions/endpoints/directus-extension-entra-auth/

# 3. Ruim de tijdelijke map op
RUN rm -rf /tmp/directus-extension-entra-auth