FROM directus/directus:latest

USER root

COPY ./extensions /directus/extensions

WORKDIR /directus

# 1. Installeer dependencies recursief (voor de build tool)
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm install --include=dev' \;

# 2. Build de extensie expliciet vanuit de eigen map
# Dit zorgt voor de juiste context voor de build tool.
RUN cd extensions/endpoints/entra-auth && npm run build

# 3. Ruim dev-dependencies op
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm prune --production' \;

RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node