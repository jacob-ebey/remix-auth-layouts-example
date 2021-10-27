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

async function filloutSignupForm(
  page: puppeteer.Page,
  email: string,
  password: string
) {
  await page.$eval(
    "input[name='firstName']",
    (element, value) => ((element as HTMLInputElement).value = value as string),
    "Name :D"
  );
  await page.$eval(
    "input[name='email']",
    (element, value) => ((element as HTMLInputElement).value = value as string),
    email
  );
  await page.$eval(
    "input[name='password']",
    (element, value) => ((element as HTMLInputElement).value = value as string),
    password
  );
  await page.$eval(
    "input[name='verifyPassword']",
    (element, value) => ((element as HTMLInputElement).value = value as string),
    password
  );
}

async function filoutLoginForm(
  page: puppeteer.Page,
  email: string,
  password: string
) {
  await page.$eval(
    "input[name='email']",
    (element, value) => ((element as HTMLInputElement).value = value as string),
    email
  );
  await page.$eval(
    "input[name='password']",
    (element, value) => ((element as HTMLInputElement).value = value as string),
    password
  );
}

test("can signup without javascript and login after", async (t) => {
  let page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await disableJavascript(page);
  await page.goto(`${testServer}/signup`);

  let email = `testemail.${new Date().getTime()}@test.com`;
  let password = "abc123";

  await filloutSignupForm(page, email, password);

  await Promise.all([
    page.click("button[type=submit]"),
    page.waitForSelector("[data-testid='logout']"),
  ]);

  await Promise.all([
    page.click("[data-testid='logout']"),
    page.waitForSelector("[data-testid='login']"),
  ]);

  await Promise.all([
    page.click("[data-testid='login']"),
    page.waitForNavigation(),
  ]);

  await filoutLoginForm(page, email, password);

  await Promise.all([
    page.click("button[type=submit]"),
    page.waitForSelector("[data-testid='logout']"),
  ]);

  t.pass();
});

test("can signup with javascript and login after", async (t) => {
  let page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.goto(`${testServer}/signup`);
  await reactIsHydrated(page);

  let email = `testemail.${new Date().getTime()}@test.com`;
  let password = "abc123";

  await filloutSignupForm(page, email, password);

  await Promise.all([
    page.click("button[type=submit]"),
    page.waitForSelector("[data-testid='logout']"),
  ]);

  await Promise.all([
    page.click("[data-testid='logout']"),
    page.waitForSelector("[data-testid='login']"),
  ]);

  await Promise.all([
    page.click("[data-testid='login']"),
    page.waitForSelector("input[name='email']"),
  ]);

  await filoutLoginForm(page, email, password);

  await Promise.all([
    page.click("button[type=submit]"),
    page.waitForSelector("[data-testid='logout']"),
  ]);

  t.pass();
});
