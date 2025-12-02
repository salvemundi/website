FROM directus/directus:latest

USER root

# Copy extension to a fixed folder name to control the URL prefix
COPY ./extensions/endpoints/entra-auth /directus/extensions/directus-extension-entra-auth

WORKDIR /directus

# Install production dependencies directly in the source folder
# bypassing the need for a build step entirely.
RUN cd /directus/extensions/directus-extension-entra-auth && npm install --omit=dev

# Restore permissions
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node