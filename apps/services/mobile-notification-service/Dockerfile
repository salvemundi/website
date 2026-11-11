FROM node:24-alpine
WORKDIR /app
COPY apps/services/mobile-notification-service/package.json ./package.json
# No lifecycle scripts or development dependencies are needed by this worker.
RUN npm install --omit=dev --ignore-scripts --package-lock=false && npm cache clean --force
COPY apps/services/mobile-notification-service/src ./src
COPY apps/frontend/src/shared/lib/permissions-config.ts ./permissions-config.ts
USER node
CMD ["node", "src/server.mjs"]
