import { Form } from "remix";
import { Link, useHref, useLocation } from "react-router-dom";
import cn from "classnames";

type NavbarProps = {
  cartCount: number;
  className?: string;
  loggedIn?: boolean;
};

export default function Navbar({
  cartCount,
  className,
  loggedIn,
}: NavbarProps) {
  let location = useLocation();
  let redirectSearch = new URLSearchParams({
    redirect: location.pathname,
  });
  let logoutAction = useHref({
    pathname: "/logout",
    search: redirectSearch.toString(),
  });

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
          <Form method="post" action={logoutAction} className="px-2 mx-2">
            <button type="submit">Logout</button>
          </Form>
        </>
      ) : null}
      <div className="px-2 mx-2">
        <Link to="/cart" className="flex flex-nowrap text-current">
          ({cartCount})
          <svg
            className="w-6 h-6 ml-2"
            viewBox="0 0 36 36"
            preserveAspectRatio="xMidYMid meet"
            focusable="false"
            role="img"
            fill="currentColor"
          >
            <circle cx="13.33" cy="29.75" r="2.25"></circle>
            <circle cx="27" cy="29.75" r="2.25"></circle>
            <path d="M33.08,5.37A1,1,0,0,0,32.31,5H11.49l.65,2H31L28.33,19h-15L8.76,4.53a1,1,0,0,0-.66-.65L4,2.62a1,1,0,1,0-.59,1.92L7,5.64l4.59,14.5L9.95,21.48l-.13.13A2.66,2.66,0,0,0,9.74,25,2.75,2.75,0,0,0,12,26H28.69a1,1,0,0,0,0-2H11.84a.67.67,0,0,1-.56-1l2.41-2H29.13a1,1,0,0,0,1-.78l3.17-14A1,1,0,0,0,33.08,5.37Z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
