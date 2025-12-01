FROM directus/directus:latest

USER root

COPY ./extensions /directus/extensions

# Work from root for global operations
WORKDIR /directus

# 1. Install dependencies INSIDE the extension directory
# This ensures node_modules are exactly where npm run build expects them
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm install --include=dev' \;

# 2. Build the extension by CHANGING DIRECTORY first
# This definitively solves "Invalid package.json" because CWD is correct.
# We use npm run build to utilize the local binaries automatically.
RUN cd extensions/endpoints/entra-auth && npm run build

# 3. Cleanup dependencies
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm prune --production' \;

# Restore permissions
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node