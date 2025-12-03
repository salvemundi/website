# Gebruik de officiële Directus basis-image
FROM directus/directus:latest

# Stap 1: Voorbereiding op pnpm installaties
# Ga naar root om corepack in te schakelen (pnpm manager)
USER root
RUN corepack enable
USER node

# Stap 2: Custom Extensie - Microsoft Entra ID Endpoint
# Aanname: De map 'directus-extension-entra-auth' staat naast de Dockerfile.

# Kopieer de custom extensie code. Stel de eigenaar direct in op 'node' om EACCES errors te voorkomen.
COPY --chown=node:node ./directus-extension-entra-auth /tmp/directus-extension-entra-auth

# Ga naar de map van de custom extensie om afhankelijkheden te installeren
WORKDIR /tmp/directus-extension-entra-auth
RUN pnpm install

# Verplaats de geïnstalleerde extensiemap naar de definitieve Directus extensie map
RUN mv . /directus/extensions/endpoints/directus-extension-entra-auth

# Stap 3: Terug naar de standaard werkmap
WORKDIR /directus