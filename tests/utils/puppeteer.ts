import type { Page } from "puppeteer";

export async function disableJavascript(page: Page) {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.resourceType() === "script") request.abort();
    else request.continue();
  });
}

export function reactIsHydrated(page: Page) {
  return page.waitForFunction("window.reactIsHydrated === true");
}
