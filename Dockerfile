FROM node:22-alpine AS build

WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /src/dist ./dist
COPY --from=build /src/server ./server

EXPOSE 8080

CMD ["node", "server/index.mjs"]
