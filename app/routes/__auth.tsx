import { useLocation, NavLink, Outlet } from "react-router-dom";
import cn from "classnames";

let tabClassName = ({ isActive }: { isActive: boolean }) =>
  cn("tab tab-bordered tab-lg", isActive && "tab-active");

export default function AuthLayout() {
  let location = useLocation();
  let searchParams = new URLSearchParams(location.search);
  let redirect = searchParams.get("redirect");
  let search = redirect ? `?redirect=${redirect}` : undefined;

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="flex-col justify-center hero-content lg:flex-row">
        <div className="text-center lg:text-left">
          <h1 className="mb-5 text-5xl font-bold">Hello there</h1>
          <p className="mb-5">
            Due to Remix being nothing less than awesome, this login flow works
            without javascript!
          </p>
          <p className="mb-5">With javascript it's even better 🚀</p>
        </div>
        <div>
          <div className="tabs">
            <NavLink
              replace
              to={{ pathname: "login", search }}
              className={tabClassName}
            >
              Login
            </NavLink>
            <NavLink
              replace
              to={{ pathname: "signup", search }}
              className={tabClassName}
            >
              Signup
            </NavLink>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
