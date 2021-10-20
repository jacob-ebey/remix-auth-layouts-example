FROM alpine as base

RUN apk add --update nodejs

ENV NODE_ENV=production

ARG REMIX_TOKEN
ENV REMIX_TOKEN=$REMIX_TOKEN

# install all node_modules, including dev
FROM base as deps

RUN apk add --update npm

RUN mkdir /app/
WORKDIR /app/

ADD package.json package-lock.json .npmrc ./
RUN npm install --production=false

# install only production modules
FROM deps as production-deps

RUN mkdir /app/
WORKDIR /app/

ADD prisma .
RUN npx prisma generate

RUN npm prune --production=true

## build the app
FROM deps as build

RUN mkdir /app/
WORKDIR /app/

ADD . .
RUN npm run build

FROM base

RUN mkdir /app/
WORKDIR /app/

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/server.ts /app/server.ts
COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public

CMD ["npm", "start"]