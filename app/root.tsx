import type { LoaderFunction, MetaFunction } from "remix";
import {
  Meta,
  Links,
  Scripts,
  LiveReload,
  useCatch,
  useLoaderData,
} from "remix";
import { Link, Outlet } from "react-router-dom";

import Footer from "./components/footer";
import Navbar from "./components/navbar";

import globalStylesUrl from "./styles/global.css";
import tailwindStylesUrl from "./styles/tailwind.css";

import { parserUserId } from "./utils/auth.server";

export let meta: MetaFunction = () => {
  return {
    title: "Remix Starter",
    description: "Welcome to remix!",
  };
};

type RootLoaderData = {
  year: string;
  loggedIn: boolean;
};

export let loader: LoaderFunction = async ({
  request,
}): Promise<RootLoaderData> => {
  let userId = await parserUserId(request.headers.get("Cookie"));

  return {
    loggedIn: !!userId,
    year: new Date().getFullYear().toString(),
  };
};

function Document({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en" data-theme="synthwave">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        {title ? <title>{title}</title> : null}
        <Meta />
        <link rel="stylesheet" href={tailwindStylesUrl} />
        <link rel="stylesheet" href={globalStylesUrl} />
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

export default function App() {
  let loaderData = useLoaderData<RootLoaderData>();

  return (
    <Document>
      <Navbar loggedIn={loaderData.loggedIn} />
      <Outlet />
      <Footer year={loaderData.year} />
    </Document>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  switch (caught.status) {
    case 401:
    case 404:
      return (
        <Document title={`${caught.status} ${caught.statusText}`}>
          <Navbar />
          <div className="hero min-h-screen bg-base-200">
            <div className="text-center hero-content">
              <div className="max-w-md">
                <h1 className="mb-5 text-5xl font-bold">
                  {caught.status} {caught.statusText}
                </h1>
                <p className="mb-5">
                  Try heading back to the{" "}
                  <Link to="/" className="underline">
                    home page
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Document>
      );

    default:
      throw new Error(
        `Unexpected caught response with status: ${caught.status}`
      );
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <Document title="Uh-oh!">
      <Navbar className="bg-error" />
      <div className="hero min-h-screen bg-error">
        <div className="text-center hero-content">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold">Oh no!</h1>
            <p className="mb-5">
              Something went terribly wrong. Try refreshing the page, going
              back, or heading{" "}
              <Link to="/" className="underline">
                home
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </Document>
  );
}
