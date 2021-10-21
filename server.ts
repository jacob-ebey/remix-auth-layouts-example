import path from "path";
import express from "express";
import compression from "compression";
import { createRequestHandler } from "@remix-run/express";

import createShopifyProvider from "./commerce-provider/shopify";

import { RequestContext } from "./app/context.server";

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

app.all(
  "*",
  MODE === "production"
    ? createRequestHandler({ build: require("./build"), getLoadContext })
    : (req, res, next) => {
        purgeRequireCache();
        let build = require("./build");
        return createRequestHandler({ build, getLoadContext, mode: MODE })(
          req,
          res,
          next
        );
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
