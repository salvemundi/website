FROM directus/directus:latest

USER root

COPY ./extensions /directus/extensions

# We blijven in de root werken voor globale operaties
WORKDIR /directus

# 1. Installeer dependencies IN de extensie map
# Dit zorgt dat node_modules precies daar staan waar npm run build ze verwacht
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm install --include=dev' \;

# 2. Build de extensie door DE MAP IN TE GAAN
# Dit lost de "Invalid package.json" fout definitief op omdat de CWD (Current Working Directory) correct is.
RUN cd extensions/endpoints/entra-auth && npm run build

# 3. Cleanup dependencies
RUN find extensions -name package.json -exec sh -c 'cd $(dirname {}) && npm prune --production' \;

# Rechten herstellen
RUN chown -R node:node /directus/extensions

WORKDIR /directus
USER node