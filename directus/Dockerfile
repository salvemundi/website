FROM directus/directus:latest

USER root

# FIX: We kopiëren NIET meer de hele extensions map structuur.
# In plaats daarvan pakken we de specifieke extensie uit de 'endpoints' map
# en plaatsen deze DIRECT in de root van de extensions folder in de container.
# Dit voldoet aan de Directus v11 vereisten (geen nested types meer).
COPY ./extensions/endpoints/entra-auth /directus/extensions/directus-extension-entra-auth

WORKDIR /directus

# 1. Installeer dependencies in de nieuwe, platte locatie
# We installeren alleen productie-dependencies (geen build tools nodig voor raw source).
RUN cd /directus/extensions/directus-extension-entra-auth && npm install --omit=dev

# 2. Herstel rechten
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node