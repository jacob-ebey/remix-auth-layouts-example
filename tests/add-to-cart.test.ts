import type { Server } from "http";
import type { AddressInfo } from "net";

import test, { after, before } from "ava";
import proxyquire from "proxyquire";
import puppeteer from "puppeteer";
import type { Browser } from "puppeteer";

import createCommerceProvider from "./mocks/commerce-provider";
import createPrismaClientMock from "./mocks/prisma";
import createRedisMock from "./mocks/redis";
import { disableJavascript, reactIsHydrated } from "./utils/puppeteer";

let browser: Browser;
let server: Server;
let testServer: string;

before(async () => {
  let proxies = {
    "@prisma/client": createPrismaClientMock(),
    redis: createRedisMock(),
    "commerce-provider/shopify": createCommerceProvider,
  };

  server = proxyquire.noCallThru()("../server.js", proxies).default.listen(0);

  let testPort = (server.address() as AddressInfo).port;
  testServer = `http://localhost:${testPort}`;

  browser = await puppeteer.launch();
});

after.always(async () => {
  await browser.close();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

test("adds to bag without javascript", async (t) => {
  let page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await disableJavascript(page);
  await page.goto(`${testServer}/p/product-1?Color=Black&Size=10`);
  await page.click("[data-testid='addToCart']");
  await page.waitForSelector("[data-testid='addToCartSuccess']");

  t.pass();
});

test("adds to bag with javascript", async (t) => {
  let page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.goto(`${testServer}/p/product-1?Color=Black&Size=10`);
  await reactIsHydrated(page);
  await page.click("[data-testid='addToCart']");
  await page.waitForSelector("[data-testid='addToCartSuccess']");

  t.pass();
});
