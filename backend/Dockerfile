FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p logs uploads && chmod 755 logs uploads

EXPOSE 5000

CMD ["node", "server.js"]