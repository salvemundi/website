# Gebruik de officiële Directus basis-image
FROM directus/directus:latest

# Stap 1: Voorbereiding op pnpm installaties
# Ga naar root om corepack in te schakelen (pnpm manager)
USER root
RUN corepack enable
USER node

# Stap 2: Custom Extensie - Microsoft Entra ID Endpoint

# Kopieer de custom extensie code. Stel de eigenaar direct in op 'node' om permissie-errors te voorkomen.
COPY --chown=node:node ./directus-extension-entra-auth /tmp/directus-extension-entra-auth

# Ga naar de map van de custom extensie om afhankelijkheden te installeren
WORKDIR /tmp/directus-extension-entra-auth
RUN pnpm install

# Stap 3: Verplaatsing en Terugkeer naar Standaard Werkmap
# We veranderen de WORKDIR naar /directus om te garanderen dat de 'mv' niet faalt
WORKDIR /directus 

# Verplaats de GEHELE geïnstalleerde extensiemap vanaf de absolute /tmp/ locatie naar de definitieve bestemming.
RUN mv /tmp/directus-extension-entra-auth /directus/extensions/endpoints/directus-extension-entra-auth