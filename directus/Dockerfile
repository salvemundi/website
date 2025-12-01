FROM directus/directus:latest

USER root

# 1. Kopieer extensies
COPY ./extensions /directus/extensions

# 2. Build de 'entra-auth' extensie
WORKDIR /directus/extensions/endpoints/entra-auth

# Installeer dev-dependencies (nodig voor de build tool)
RUN npm install --include=dev
# Build de code (maakt dist/ map aan)
RUN npm run build
# Schoonmaak
RUN npm prune --production

# 3. Herstel rechten
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node