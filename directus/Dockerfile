FROM directus/directus:latest

USER root

COPY ./extensions /directus/extensions

WORKDIR /directus

# 1. Install dependencies INSIDE the extension directory
# Using 'sh' for Alpine compatibility.
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm install --include=dev' \;

# 2. Build the extension explicitly from its own directory
# This utilizes the local 'npm run build' script defined in package.json.
# This resolves binary paths, config contexts, and avoids global npx issues.
RUN cd extensions/endpoints/entra-auth && npm run build

# 3. Cleanup dev dependencies to reduce image size
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm prune --production' \;

# Restore permissions
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node