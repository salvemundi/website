FROM directus/directus:latest

USER root

COPY ./extensions /directus/extensions

# Set working directory to root to allow correct extension build context resolution
WORKDIR /directus

# Install dependencies for all extensions found in the directory tree
# Using 'sh' execution ensures compatibility with Alpine-based images
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm install --include=dev' \;

# Build the Entra Auth extension using the local binary to avoid npm registry 404s
# Explicit path argument ensures the builder targets the correct source
RUN ./node_modules/.bin/directus-extension build ./extensions/endpoints/entra-auth

# Remove devDependencies to keep the production image clean
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm prune --production' \;

# Ensure correct permissions for the node user
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node