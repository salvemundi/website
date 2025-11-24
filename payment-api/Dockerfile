FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --production

COPY . .

# Beveiliging: draai niet als root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENV PORT=3002
EXPOSE 3002

CMD ["node", "server.js"]