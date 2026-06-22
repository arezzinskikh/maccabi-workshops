FROM node:20-alpine AS base

RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git

WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm install

FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 strapi

COPY --from=build --chown=strapi:nodejs /app/package*.json ./
COPY --from=build --chown=strapi:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=strapi:nodejs /app/build ./build
COPY --from=build --chown=strapi:nodejs /app/src ./src
COPY --from=build --chown=strapi:nodejs /app/config ./config
COPY --from=build --chown=strapi:nodejs /app/database ./database
COPY --from=build --chown=strapi:nodejs /app/public ./public

USER strapi

EXPOSE 1337

CMD ["npm", "run", "start"]
