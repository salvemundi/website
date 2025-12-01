FROM directus/directus:latest

USER root

COPY ./extensions /directus/extensions

# Set working directory to root to allow correct extension build context resolution
WORKDIR /directus

# Install dependencies for all extensions found in the directory tree
# This installs the @directus/extensions-sdk into the extension's own node_modules
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm install --include=dev' \;

# Build the Entra Auth extension using the LOCALLY installed binary inside the extension folder
# We point to the specific binary inside the extension's node_modules to resolve the "not found" error
RUN ./extensions/endpoints/entra-auth/node_modules/.bin/directus-extension build ./extensions/endpoints/entra-auth

# Remove devDependencies to keep the production image clean
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm prune --production' \;

# Ensure correct permissions for the node user
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node