FROM directus/directus:latest

USER root

COPY ./extensions /directus/extensions

WORKDIR /directus

# 1. Install PRODUCTION dependencies only inside the extension directory
# We bypass the build step entirely to avoid Rollup wrapping the CJS export.
# Directus will load src/index.js directly (as defined in package.json main).
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm install --omit=dev' \;

# 2. Restore permissions
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node