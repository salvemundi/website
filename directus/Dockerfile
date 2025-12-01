FROM directus/directus:latest

USER root

# 1. Kopieer extensie broncode naar de container
COPY ./extensions /directus/extensions

# 2. Build de 'entra-auth' extensie
WORKDIR /directus/extensions/endpoints/entra-auth

# Installeer dependencies inclusief dev-tools (nodig voor de build stap)
RUN npm install --include=dev

# Compileer de broncode (src -> dist)
RUN npm run build

# Verwijder development dependencies voor een schonere productie-image
RUN npm prune --production

# 3. Herstel eigendomsrechten voor de node gebruiker
RUN chown -R node:node /directus/extensions

# Reset werkmap en gebruiker
WORKDIR /directus
USER node