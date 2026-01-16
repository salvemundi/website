FROM node:24-alpine
# Deployment retry trigger: 2026-01-16T16:13

# Security update (Best Practice: update OS packages immediately)
RUN apk update && \ 
    apk upgrade && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --production

COPY . .

# Beveiliging: draai niet als root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

ENV PORT=3002
EXPOSE 3002

CMD ["node", "server.js"]