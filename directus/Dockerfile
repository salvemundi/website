# Gebruik de officiële Directus basis-image
FROM directus/directus:latest

# Stap 1: Voorbereiding op pnpm installaties
# Ga naar root om corepack in te schakelen (pnpm manager)
USER root
RUN corepack enable
USER node

# Stap 2: Custom Extensie - Microsoft Entra ID Endpoint
# Aanname: De map 'directus-extension-entra-auth' staat naast de Dockerfile.

# Kopieer de custom extensie code. Stel de eigenaar direct in op 'node' om permissie-errors te voorkomen.
COPY --chown=node:node ./directus-extension-entra-auth /tmp/directus-extension-entra-auth

WORKDIR /tmp/directus-extension-entra-auth
RUN pnpm install

# Verlaat de map om conflicten te vermijden
WORKDIR /directus 

# Verplaats de inhoud (source code + node_modules) naar de definitieve bestemming.
# We gebruiken 'cp -r' in plaats van 'mv' om te garanderen dat de bestanden bestaan
# en gebruiken 'rm -rf' om op te ruimen.
# We moeten eerst de doelmap creëren om de cp instructie correct te laten werken.
RUN mkdir -p /directus/extensions/endpoints/directus-extension-entra-auth
RUN cp -r /tmp/directus-extension-entra-auth/. /directus/extensions/endpoints/directus-extension-entra-auth
RUN rm -rf /tmp/directus-extension-entra-auth