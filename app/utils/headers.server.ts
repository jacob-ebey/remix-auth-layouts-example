import parseCacheControlHeader from "parse-cache-control";

import type { HeadersFunction } from "remix";

function getMaxAge(cacheControlHeader: string | null) {
  let cacheControl =
    cacheControlHeader && parseCacheControlHeader(cacheControlHeader);

  let maxAge: number | undefined = undefined;
  if (
    cacheControl &&
    !cacheControl["no-store"] &&
    cacheControl["stale-while-revalidate"]
  ) {
    let smaxage = cacheControl["s-maxage"];
    if (typeof smaxage !== "undefined") {
      maxAge =
        typeof smaxage === "string" ? Number.parseInt(smaxage, 10) : smaxage;
    } else if (typeof cacheControl["max-age"] !== "undefined") {
      maxAge = cacheControl["max-age"];
    }
  } else if (cacheControl && cacheControl["no-store"]) {
    maxAge = 0;
  }
  return maxAge;
}

export let swrHeaders: HeadersFunction = ({
  actionHeaders,
  loaderHeaders,
  parentHeaders,
}) => {
  let maxAges = [
    getMaxAge(actionHeaders.get("Cache-Control")),
    getMaxAge(loaderHeaders.get("Cache-Control")),
    getMaxAge(parentHeaders.get("Cache-Control")),
  ];

  let minAge: number | undefined = undefined;
  for (let age of maxAges) {
    if (typeof age === "undefined") {
      continue;
    }

    if (typeof minAge === "undefined" || age < minAge) {
      minAge = age;
    }
  }

  let resultHeaders = new Headers();
  for (let headers of [parentHeaders, loaderHeaders, actionHeaders]) {
    let setHeaders = new Set<string>();
    for (let [key, value] of headers.entries()) {
      if (setHeaders.has(key)) {
        resultHeaders.append(key, value);
      } else {
        resultHeaders.set(key, value);
      }
      setHeaders.add(key);
    }
  }

  if (typeof minAge !== "undefined" && minAge > 0) {
    resultHeaders.set(
      "Cache-Control",
      `stale-while-revalidate, s-maxage=${minAge}`
    );
  } else {
    resultHeaders.delete("Cache-Control");
  }

  return resultHeaders;
};
