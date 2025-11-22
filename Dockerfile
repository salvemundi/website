FROM node:18-alpine AS build
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
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]