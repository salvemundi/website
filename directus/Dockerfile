# Gebruik de officiële Directus basis-image
FROM directus/directus:latest

# Stap 1: Voorbereiding
USER root
RUN corepack enable

# Stap 2: Kopieer de 'src' map en package.json handmatig
# Dit zorgt dat de structuur in Directus precies klopt met hoe package.json ernaar verwijst.
WORKDIR /directus/extensions/endpoints/directus-extension-entra-auth
COPY --chown=node:node ./directus-extension-entra-auth/package.json ./
COPY --chown=node:node ./directus-extension-entra-auth/src ./src

# Stap 3: Installeer afhankelijkheden
# --production zorgt dat devDependencies (@directus/sdk) worden overgeslagen
RUN npm install --production

# Stap 4: Herstel Rechten (voor de zekerheid)
WORKDIR /directus
RUN chown -R node:node /directus/extensions

USER node