FROM node:22-alpine AS builder
WORKDIR /app

# Build arguments (deze komen uit je GitHub Secrets)
ARG VITE_ENTRA_CLIENT_ID
ARG VITE_ENTRA_TENANT_ID
ARG VITE_AUTH_REDIRECT_URI
ARG VITE_DIRECTUS_URL

# Zet ze om naar environment variabelen voor het build process (Vite)
ENV VITE_ENTRA_CLIENT_ID=$VITE_ENTRA_CLIENT_ID
ENV VITE_ENTRA_TENANT_ID=$VITE_ENTRA_TENANT_ID
ENV VITE_AUTH_REDIRECT_URI=$VITE_AUTH_REDIRECT_URI
ENV VITE_DIRECTUS_URL=$VITE_DIRECTUS_URL

COPY package*.json ./
# Gebruik 'npm ci' voor snellere, consistente installs in CI
RUN npm ci
COPY . .
# Start de productie build
RUN npm run build

FROM nginx:stable-alpine AS final
# Kopieer de gebouwde bestanden van de 'builder' stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]