import crypto from "crypto";
import path from "path";

import express from "express";
import compression from "compression";

import createShopifyProvider from "./commerce-provider/shopify";
import type { StaleWhileRevalidateStore } from "./remix/express-swr";
import { createSwrRequestHandler } from "./remix/express-swr";

import type { RequestContext } from "./app/context.server";
import redis from "./app/libs/redis.server";

const MODE = process.env.NODE_ENV;
const BUILD_DIR = path.join(process.cwd(), "build");

let app = express();
app.use(compression());

// You may want to be more aggressive with this caching
app.use(express.static("public", { maxAge: "1h" }));

// Remix fingerprints its assets so we can cache forever
app.use(express.static("public/build", { immutable: true, maxAge: "1y" }));

function getLoadContext(): RequestContext {
  return {
    commerce: createShopifyProvider({
      storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
    }),
  };
}

let cacheStore: StaleWhileRevalidateStore = {
  async del(key) {
    await new Promise<void>((resolve, reject) => {
      redis.del(key, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  get(key) {
    console.log({ key });
    return new Promise<string | null>((resolve, reject) => {
      redis.get(key, (err, value) => {
        if (err) reject(err);
        else resolve(value);
      });
    });
  },
  async set(key, value, maxAge) {
    await new Promise<void>((resolve, reject) => {
      redis.set(key, value, "EX", maxAge * 2, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
};

app.all(
  "*",
  MODE === "production"
    ? createSwrRequestHandler({
        build: require("./build"),
        getLoadContext,
        store: cacheStore,
      })
    : (req, res, next) => {
        purgeRequireCache();
        let build = require("./build");
        return createSwrRequestHandler({
          build,
          getLoadContext,
          mode: MODE,
          store: cacheStore,
        })(req, res, next);
      }
);

let port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

////////////////////////////////////////////////////////////////////////////////
function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (let key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key];
    }
  }
}
