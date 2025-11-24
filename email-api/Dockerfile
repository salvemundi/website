FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first using package manifests for better caching
COPY package.json package-lock.json* ./

RUN npm ci --only=production || npm install --production

# Bundle app source
COPY . .

# Use a non-root user for improved security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]
