FROM node:16-bullseye-slim as base

# install open ssl for prisma
RUN apt-get update && apt-get install -y openssl 

ENV NODE_ENV=production

ARG REMIX_TOKEN
ENV REMIX_TOKEN=$REMIX_TOKEN

# install all node_modules, including dev
FROM base as deps

RUN mkdir /app/
WORKDIR /app/

ADD prisma .
ADD package.json package-lock.json .npmrc ./
RUN npm install --production=false

# install only production modules
FROM deps as production-deps

WORKDIR /app/

RUN npm prune --production=true

## build the app
FROM deps as build

WORKDIR /app/

ADD . .
RUN npm run build

## copy over assets required to run the app
FROM base

RUN mkdir /app/
WORKDIR /app/

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/server.js /app/server.js
COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public

CMD ["node", "./server.js"]