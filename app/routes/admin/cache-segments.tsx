import { Fragment } from "react";
import type { LoaderFunction } from "remix";
import { json, useLoaderData } from "remix";
import { Link, useLocation } from "react-router-dom";

import redis from "~/libs/redis.server";

type CachedAppVersion = {
  count: number;
  version: string;
};

type CachSegment = {
  url: string;
  segments: string[];
};

type CacheSegmentsLoaderData = {
  apps: CachedAppVersion[];
  loaderSegments?: CachSegment[];
  documentSegments?: CachSegment[];
  selectedVersion?: string;
};

export let headers = () => ({
  "Cache-Control": "no-store",
});

export let loader: LoaderFunction = async ({ request }) => {
  let url = new URL(request.url);
  let selectedVersion = url.searchParams.get("version") || undefined;

  let keys = await new Promise<string[]>((resolve, reject) => {
    redis.keys("swr-version: *", (error, keys) => {
      if (error) reject(error);
      else resolve(keys);
    });
  });

  let appsMap = new Map<string, number>();
  let documentSegmentsMap = selectedVersion
    ? new Map<string, string[]>()
    : undefined;
  let loaderSegmentsMap = selectedVersion
    ? new Map<string, string[]>()
    : undefined;

  for (let key of keys) {
    let versionMatch = key.match(/^swr-version: ([\w\d]+) \|/);
    if (!versionMatch || !versionMatch[1]) continue;
    let version = versionMatch[1];
    let count = (appsMap.get(version) || 0) + 1;
    appsMap.set(version, count);

    if (selectedVersion && version === selectedVersion) {
      let urlMatch = key.match(
        /^swr-version: [\w\d]+ \| url: ([ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\%\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]+)(.*)/
      );
      if (!urlMatch || !urlMatch[1]) continue;
      let url = urlMatch[1];
      let segment = urlMatch[2] || "";

      let searchParams = new URL(url).searchParams;
      if (searchParams.has("_data")) {
        let segments = loaderSegmentsMap!.get(url) || [];
        segments.push(segment);
        loaderSegmentsMap!.set(url, segments);
      } else {
        let segments = documentSegmentsMap!.get(url) || [];
        segments.push(segment);
        documentSegmentsMap!.set(url, segments);
      }
    }
  }

  let apps = Array.from(appsMap.entries()).map<CachedAppVersion>(
    ([version, count]) => ({ count, version })
  );

  let result: CacheSegmentsLoaderData = {
    apps,
    documentSegments: documentSegmentsMap
      ? Array.from(documentSegmentsMap).map<CachSegment>(([url, segments]) => ({
          url,
          segments,
        }))
      : undefined,
    loaderSegments: loaderSegmentsMap
      ? Array.from(loaderSegmentsMap).map<CachSegment>(([url, segments]) => ({
          url,
          segments,
        }))
      : undefined,
    selectedVersion,
  };

  return json(result);
};

export default function CacheSegments() {
  let { apps, documentSegments, loaderSegments, selectedVersion } =
    useLoaderData<CacheSegmentsLoaderData>();

  let location = useLocation();

  return (
    <div className="px-2 py-6 max-w-6xl mx-auto">
      <h1 className="text-4xl font-semibold mb-6">Cache Segments</h1>

      <h2 className="text-2xl font-semibold mb-6">
        {apps.length ? "Apps" : "No apps in cache"}
        <Link to={location} className="btn btn-accent ml-6">
          Refresh
        </Link>
      </h2>
      <ul>
        {apps.map((app) => (
          <li key={app.version} className="shadow stats">
            <Link
              to={{ pathname: ".", search: `?version=${app.version}` }}
              className="stat"
            >
              <div className="stat-title">Version: {app.version}</div>
              <div className="stat-value">{app.count}</div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="divider my-6" />

      {selectedVersion ? (
        <>
          <h2 className="text-2xl font-semibold mb-6">
            Selected App: {selectedVersion}{" "}
          </h2>

          <div className="card bordered mb-6">
            <div className="card-body">
              {!documentSegments || !documentSegments.length ? (
                <h3 className="card-title">No document segments.</h3>
              ) : (
                <>
                  <h3 className="card-title">Document Cache:</h3>
                  <div className="overflow-x-auto">
                    <table className="table w-full table-compact">
                      <thead>
                        <tr>
                          <th>URL</th>
                          <th>Segments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documentSegments.map((segment, index) => {
                          return (
                            <Fragment key={segment.url + ` | ${index}`}>
                              <tr className="active">
                                <td>{decodeURI(segment.url)}</td>

                                <td></td>
                              </tr>
                              {segment.segments.map((seg, idx) => (
                                <tr key={seg + ` | ${idx}`}>
                                  <td></td>
                                  <td>{seg}</td>
                                </tr>
                              ))}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card bordered mb-6">
            <div className="card-body">
              {!loaderSegments || !loaderSegments.length ? (
                <h3 className="card-title">No loader segments.</h3>
              ) : (
                <>
                  <h3 className="card-title">Loader Cache:</h3>
                  <div className="overflow-x-auto">
                    <table className="table w-full table-compact">
                      <thead>
                        <tr>
                          <th>URL</th>
                          <th>Loader</th>
                          <th>Segments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loaderSegments.map((segment, index) => {
                          let url = new URL(segment.url);
                          let loader = url.searchParams.get("_data");
                          url.searchParams.delete("_data");
                          return (
                            <Fragment key={segment.url + ` | ${index}`}>
                              <tr className="active">
                                <td>{decodeURI(url.toString())}</td>
                                <td>{loader}</td>
                                <td></td>
                              </tr>
                              {segment.segments.map((seg, idx) => (
                                <tr key={seg + ` | ${idx}`}>
                                  <td></td>
                                  <td></td>
                                  <td>{seg}</td>
                                </tr>
                              ))}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
