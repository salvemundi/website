FROM directus/directus:latest

USER root

# 1. Kopieer de extensies naar de container
COPY ./extensions /directus/extensions

# 2. Installeer en Build de 'entra-auth' extensie
# WAAROM: De package.json verwijst naar 'dist/index.js', maar we hebben alleen broncode.
# We moeten dit compileren zodat Directus het bestand kan vinden.
WORKDIR /directus/extensions/endpoints/entra-auth
RUN npm install
RUN npm run build

# 3. Herstel rechten en werkmap
# WAAROM: Directus draait als 'node' user, dus die moet eigenaar zijn.
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node