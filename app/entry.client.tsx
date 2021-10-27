import ReactDOM from "react-dom";
import { RemixBrowser } from "remix";

ReactDOM.hydrate(<RemixBrowser />, document);

(window as any).reactIsHydrated = true;

if (process.env.NODE_ENV === "development") {
  let ogFetch = fetch;
  window.fetch = async function fetchDevWrapped() {
    let method = "UNKNOWN";

    if (typeof arguments[0] === "string" && arguments[1]) {
      method = (arguments[1].method || "GET").toUpperCase();
    }

    let response = await ogFetch.apply(null, arguments as any);

    let url = new URL(response.url);
    if (url.searchParams.has("_data")) {
      console.log(
        "cache",
        response.headers.get("x-cache-status") || "UNKNOWN",
        url.searchParams.get("_data"),
        method
      );
    }

    return response;
  } as any;
}
