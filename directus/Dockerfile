FROM directus/directus:latest

USER root

# 1. Kopieer alle extensies naar de container
COPY ./extensions /directus/extensions

# 2. Build de 'entra-auth' extensie
WORKDIR /directus/extensions/endpoints/entra-auth

# WAAROM: De Directus image staat standaard op 'production', waardoor devDependencies
# (zoals de builder) worden overgeslagen. We forceren hier de installatie van dev-tools.
RUN npm install --include=dev
RUN npm run build

# 3. Herstel de permissies en werkmap
# WAAROM: Zorg dat de node gebruiker eigenaar blijft van de gebouwde bestanden
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node