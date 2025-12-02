FROM directus/directus:latest

USER root

# We copy the extension to a simple folder name 'entra-auth'
# This forces Directus to mount the endpoint at /entra-auth
COPY ./extensions/endpoints/entra-auth /directus/extensions/entra-auth

WORKDIR /directus

# Install dependencies in the new 'entra-auth' directory
RUN cd /directus/extensions/entra-auth && npm install --omit=dev

# Restore permissions
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node