import { Form } from "remix";
import { Link, useLocation } from "react-router-dom";
import cn from "classnames";

type NavbarProps = {
  className?: string;
  loggedIn?: boolean;
};

export default function Navbar({ className, loggedIn }: NavbarProps) {
  let location = useLocation();

  return (
    <div
      className={cn(
        "navbar shadow-lg text-neutral-content",
        { "bg-neutral": !className?.includes("bg-") },
        className
      )}
    >
      <div className="flex-1 px-2 mx-2">
        <Link to="/" className="text-lg font-bold">
          Remix Auth
        </Link>
      </div>
      {loggedIn ? (
        <>
          <div className="px-2 mx-2">
            <Link to="/profile">Profile</Link>
          </div>
          <Form method="post" action="/logout" className="px-2 mx-2">
            <button type="submit">Logout</button>
          </Form>
        </>
      ) : null}
    </div>
  );
}
