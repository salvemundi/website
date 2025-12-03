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

# Stap 3: Kopiëren van Inhoud en Clean-up (Robuuste Methode)
# We veranderen de WORKDIR naar /directus voor de volgende stappen
WORKDIR /directus 

# 1. Maak de definitieve doelmap
RUN mkdir -p /directus/extensions/endpoints/directus-extension-entra-auth

# 2. Kopieer alle inhoud (inclusief verborgen mappen zoals .pnpm en node_modules)
# De '-a' flag zorgt voor archiefmodus, behoudt permissies en kopieert recursief.
RUN cp -a /tmp/directus-extension-entra-auth/. /directus/extensions/endpoints/directus-extension-entra-auth/

# 3. Ruim de tijdelijke map op om de image klein te houden
RUN rm -rf /tmp/directus-extension-entra-auth

# De WORKDIR is nu /directus, de correcte start-directory voor Directus.