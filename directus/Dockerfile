# Gebruik de officiële Directus basis-image
FROM directus/directus:latest

# Stap 1: Voorbereiding op pnpm installaties
# Ga naar root om corepack in te schakelen (pnpm manager)
USER root
RUN corepack enable
USER node

# Stap 2: Custom Extensie - Microsoft Entra ID Endpoint
# Aanname: De map 'directus-extension-entra-auth' staat naast de Dockerfile.

# Kopieer de custom extensie code naar een tijdelijke locatie in de container
COPY ./directus-extension-entra-auth /tmp/directus-extension-entra-auth

# Ga naar de map van de custom extensie om afhankelijkheden te installeren
WORKDIR /tmp/directus-extension-entra-auth
RUN pnpm install

# Verplaats de geïnstalleerde extensiemap naar de definitieve Directus extensie map
# Dit maakt de custom endpoint beschikbaar via /extensions/endpoints/
RUN mv . /directus/extensions/endpoints/directus-extension-entra-auth

# Stap 3: Terug naar de standaard werkmap
# Dit zorgt ervoor dat de container opstart in de verwachte Directus-directory
WORKDIR /directus