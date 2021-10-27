import type { Server } from "http";

import test, { after, before } from "ava";
import supertest from "supertest";
import proxyquire from "proxyquire";

import createCommerceProvider from "./mocks/commerce-provider";
import createPrismaClientMock from "./mocks/prisma";
import createRedisMock from "./mocks/redis";

let request: supertest.SuperAgentTest;
let server: Server;

before(() => {
  let proxies = {
    "@prisma/client": createPrismaClientMock(),
    redis: createRedisMock(),
    "commerce-provider/shopify": createCommerceProvider,
  };

  server = proxyquire.noCallThru()("../server.js", proxies).default.listen(0);
  request = supertest.agent(server);
});

after.always(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

test("caches index page", async (t) => {
  let res = await request
    .get("/")
    .expect("Content-Type", /html/)
    .expect("x-cache-status", "MISS")
    .expect(200, /Welcome to a Remix ecommerce example/);

  let cacheKey = res.get("x-cache-key");

  await request
    .get("/")
    .expect("Content-Type", /html/)
    .expect("x-cache-status", "HIT")
    .expect("x-cache-key", cacheKey)
    .expect(200, /Product 1/);

  t.pass();
});

test("caches pdp page", async (t) => {
  let res = await request
    .get("/p/snare-boot")
    .expect("Content-Type", /html/)
    .expect("x-cache-status", "MISS")
    .expect(200);

  let cacheKey = res.get("x-cache-key");

  await request
    .get("/p/snare-boot")
    .expect("Content-Type", /html/)
    .expect("x-cache-status", "HIT")
    .expect("x-cache-key", cacheKey)
    .expect(200);

  t.pass();
});

test("does not cache cart page", async (t) => {
  await request
    .get("/cart")
    .expect("Content-Type", /html/)
    .expect("x-cache-status", "BYPASS")
    .expect(404, /Cart Not Found/);

  t.pass();
});

test("does not cache login page", async (t) => {
  await request
    .get("/login")
    .expect("Content-Type", /html/)
    .expect("x-cache-status", "BYPASS")
    .expect(200, /Forgot password\?/);

  t.pass();
});

test("does not cache signup page", async (t) => {
  await request
    .get("/signup")
    .expect("Content-Type", /html/)
    .expect("x-cache-status", "BYPASS")
    .expect(200, /Subscribe to the newsletter\?/);
  t.pass();
});
