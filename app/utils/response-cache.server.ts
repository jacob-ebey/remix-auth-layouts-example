import type { Headers as NodeHeaders } from "node-fetch";
import type { EntryContext } from "remix";
import { parse as parseCookie } from "cookie";
import crypto from "crypto";
// @ts-expect-error
import parseCacheControl from "parse-cache-control";

type CacheStatus = "MISS" | "HIT" | "BYPASS" | "STALE" | "REVALIDATED";

type CachedResponse = {
  staleAt: number;
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string[]>;
};

export type StaleWhileRevalidateStore = {
  del(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, maxAge: number): Promise<void>;
};

type StaleWhileRevalidateConfig = {
  store: StaleWhileRevalidateStore;
  methods: Set<"get" | "head" | "post" | "put" | "patch" | "delete">;
  skipIfExists?: {
    cookie?: Set<string>;
  };
};

export function staleWhileRevalidate(
  config: StaleWhileRevalidateConfig,
  handler: (
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    remixContext: EntryContext
  ) => Promise<Response> | Response
) {
  async function refreshCache(
    cacheKey: string | false,
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    remixContext: EntryContext
  ) {
    let response = await handler(
      request,
      responseStatusCode,
      responseHeaders,
      remixContext
    );

    let cacheControlHeader = response.headers.get("Cache-Control");
    let cacheControl =
      cacheControlHeader && parseCacheControl(cacheControlHeader);

    if (
      cacheKey &&
      cacheControl &&
      !cacheControl["no-cache"] &&
      cacheControl["stale-while-revalidate"]
    ) {
      let maxAge = cacheControl["s-maxage"]
        ? Number.parseInt(cacheControl["s-maxage"], 10)
        : cacheControl["max-age"]
        ? Number.parseInt(cacheControl["max-age"], 10)
        : 0;

      if (maxAge && maxAge > 0) {
        await saveToCache(config.store, cacheKey, response.clone(), maxAge);
      }
    }

    return response;
  }

  return async (
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    remixContext: EntryContext
  ) => {
    let [cacheKey, cacheStatus] = getCacheKey(config, request, remixContext);
    let cacheResult: GetFromCacheResult = false;

    if (cacheKey) {
      cacheResult = await getFromCache(config.store, cacheKey);
    }

    let response: Response;

    if (!cacheResult) {
      response = await refreshCache(
        cacheKey,
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      );
    } else {
      cacheStatus = "HIT";
      response = cacheResult.response;

      if (cacheResult.stale) {
        cacheStatus = "STALE";

        refreshCache(
          cacheKey,
          request,
          responseStatusCode,
          responseHeaders,
          remixContext
        ).catch((error) => console.error("Failed to refresh cache", error));
      }
    }

    if (cacheKey) {
      response.headers.set("x-cache-id", cacheKey || "");
    }
    response.headers.set("x-cache-status", cacheStatus);

    return response;
  };
}

function getCacheKey(
  config: StaleWhileRevalidateConfig,
  request: Request,
  remixContext: EntryContext
): [false, CacheStatus] | [string, CacheStatus] {
  if (request.headers.get("Pragma")?.includes("no-cache")) {
    return [false, "REVALIDATED"];
  }

  if (!config.methods.has(request.method.toLowerCase() as any)) {
    return [false, "BYPASS"];
  }

  let cookie = request.headers.get("Cookie");
  if (config.skipIfExists?.cookie && cookie) {
    let cookies = parseCookie(cookie);
    if (
      Object.keys(cookies).some((key) => config.skipIfExists!.cookie!.has(key))
    ) {
      return [false, "BYPASS"];
    }
  }

  let cacheKey = [
    request.method.toLowerCase(),
    request.url,
    cookie,
    remixContext.manifest.url,
  ].join("|");

  return [
    crypto
      .createHash("sha1")
      .update(cacheKey)
      .digest("base64")
      .replace(/=+$/, ""),
    "MISS",
  ];
}

type GetFromCacheResult =
  | {
      response: Response;
      stale: boolean;
    }
  | false;

async function getFromCache(
  store: StaleWhileRevalidateStore,
  cacheKey: string
): Promise<GetFromCacheResult> {
  let cachedString = await store.get(cacheKey);

  if (!cachedString) {
    return false;
  }

  let cached: CachedResponse = JSON.parse(cachedString);

  let headers = new Headers();
  for (let [key, values] of Object.entries(cached.headers)) {
    for (let value of values) {
      headers.append(key, value);
    }
  }

  let response = new Response(cached.body, {
    headers,
    status: cached.status,
    statusText: cached.statusText,
  });

  let stale = false;
  if (cached.staleAt <= new Date().getTime()) {
    stale = true;
  }

  return {
    response,
    stale,
  };
}

async function saveToCache(
  store: StaleWhileRevalidateStore,
  cacheKey: string,
  response: Response,
  maxAge: number
) {
  let headers = (response.headers as unknown as NodeHeaders).raw();

  let staleAtDate = new Date();
  staleAtDate.setSeconds(staleAtDate.getSeconds() + maxAge);

  let cached: CachedResponse = {
    staleAt: staleAtDate.getTime(),
    body: await response.text(),
    headers,
    status: response.status,
    statusText: response.statusText,
  };

  store.set(cacheKey, JSON.stringify(cached), maxAge);
}
