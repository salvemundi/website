FROM node:24-alpine

# Security update (Best Practice: update OS packages immediately)
RUN apk update && \ 
    apk upgrade && \
    rm -rf /var/cache/apk/*

# Create app directory and install dependencies
WORKDIR /usr/src/app

# Gebruik package.json voor caching en installeer dependencies
COPY package.json package-lock.json* ./
# Gebruik npm ci voor clean installs in CI/CD
RUN npm ci --only-production || npm install --production

# Bundle app source
COPY . .

# Use a non-root user for improved security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

ENV PORT=3003
EXPOSE 3003

CMD ["node", "server.js"]