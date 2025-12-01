FROM directus/directus:latest

USER root

# 1. Kopieer alle extensies naar de container
COPY ./extensions /directus/extensions

# 2. Build de 'entra-auth' extensie
# WAAROM: De package.json wijst naar 'dist/index.js', maar we hebben alleen 'src/'.
# We moeten de dependencies installeren en de build-script draaien om 'dist/' te genereren.
WORKDIR /directus/extensions/endpoints/entra-auth
RUN npm install
RUN npm run build

# 3. Herstel de permissies en werkmap
# WAAROM: Directus draait als 'node' user, dus die moet eigenaar zijn van de nieuwe bestanden.
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node