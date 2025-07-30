FROM node:23.4.0-alpine
WORKDIR /app

COPY dist/ ./dist
COPY package*.json ./
COPY node_modules/ ./node_modules
COPY .env .env

CMD ["node", "dist/index.js"]
