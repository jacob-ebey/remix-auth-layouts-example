import type { LinksFunction } from "remix";
import { Link } from "react-router-dom";

import stylesUrl from "~/styles/index.css";

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export default function Index() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="text-center hero-content">
        <div className="max-w-md">
          <h1 className="mb-5 text-5xl font-bold">Welcome to Remix!</h1>
          <p className="mb-5">
            This is an example on how you can implement an awesome login flow.{" "}
            <a className="underline" href="https://docs.remix.run">
              Check out the Remix docs
            </a>{" "}
            to learn more about Remix.
          </p>
          <p className="btn-group inline-block">
            <Link to="signup" className="btn btn-primary">
              Signup
            </Link>
            <Link to="login" className="btn btn-secondary">
              Login
            </Link>
            <Link to="profile" className="btn btn-warning">
              Profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
