FROM directus/directus:latest

# Installeer sh (in geval van Alpine base image) voor de find/exec commando's
USER root

# 1. Kopieer extensie broncode naar de container
COPY ./extensions /directus/extensions

# 2. Build de 'entra-auth' extensie met de juiste context
# We werken vanaf de root (/directus) om de contextfout in de build tool te omzeilen.
WORKDIR /directus

# Installeer dependencies inclusief dev-tools (nodig voor de build stap)
# Zoek naar alle package.json in de extensions map en installeer hun afhankelijkheden.
# Dit vervangt de oude, falende WORKDIR + npm install stappen.
# We gebruiken 'sh' als shell, omdat 'bash' mogelijk niet bestaat.
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm install --include=dev' \;

# Compileer de broncode (src -> dist)
# Voer de build uit vanaf de root, met expliciete verwijzing naar de extensie.
RUN npx directus-extension build ./extensions/endpoints/entra-auth

# Verwijder development dependencies voor een schonere productie-image
# Dit moet ook vanaf de root correct worden uitgevoerd.
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm prune --production' \;

# 3. Herstel eigendomsrechten en gebruiker
RUN chown -R node:node /directus/extensions

# Reset werkmap en gebruiker
WORKDIR /directus
USER node