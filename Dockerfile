FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./

RUN npm install

COPY . .

RUN rm -rf auth node_modules/.cache

EXPOSE 3000

CMD ["node", "index.js"]