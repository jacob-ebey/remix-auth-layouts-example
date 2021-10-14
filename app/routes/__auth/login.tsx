import type { ActionFunction, MetaFunction } from "remix";
import {
  Form,
  json,
  redirect as redirectTo,
  useActionData,
  useTransition,
} from "remix";
import { Link, useLocation } from "react-router-dom";
import cn from "classnames";

import { authSession } from "~/sessions.server";
import { login } from "~/utils/auth.server";

export let meta: MetaFunction = () => {
  return {
    title: "Login",
    description: "Look at how awesome this login flow is!",
  };
};

type LoginActionData = {
  genericError?: string;
  email?: string;
  emailError?: string;
  passwordError?: string;
  redirect?: string;
};

let GENERIC_LOGIN_ERROR = "failed to login";

export let action: ActionFunction = async ({ request }) => {
  let formValues = new URLSearchParams(await request.text());
  let redirect = formValues.get("redirect");
  let email = formValues.get("email")?.trim();
  let password = formValues.get("password");

  let actionData: LoginActionData = {
    email: email || undefined,
    redirect: redirect || undefined,
  };

  // validate input
  let hasError = false;
  if (!email || !email.match(/(.+)@(.+){2,}\.(.+){2,}/)) {
    hasError = true;
    actionData.emailError = "please provide a valid email";
  }
  if (!password) {
    hasError = true;
    actionData.passwordError = "please provide a password";
  } else if (password.length < 6) {
    hasError = true;
    actionData.passwordError = "password must be at least 6 characters long";
  }

  // bail early on error to show user
  if (hasError) {
    return json(actionData, { status: 400 });
  }

  email = email as string;
  password = password as string;

  let user = await login(email, password);

  if (!user) {
    actionData.genericError = GENERIC_LOGIN_ERROR;

    return json(actionData, { status: 401 });
  }

  let session = await authSession.getSession(request.headers.get("Cookie"));
  session.set("userId", user.id);

  return redirectTo(redirect || "/", {
    headers: {
      "Set-Cookie": await authSession.commitSession(session),
    },
  });
};

export default function Login() {
  let { genericError, email, emailError, passwordError, redirect } =
    useActionData<LoginActionData>() || {};

  let transition = useTransition();

  let location = useLocation();
  let searchParams = new URLSearchParams(location.search);
  email = searchParams.get("email") || email;
  redirect = searchParams.get("redirect") || redirect;

  let loggingIn = transition.state === "submitting";

  return (
    <Form
      method="post"
      className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100 rounded-t-none"
    >
      {redirect ? (
        <input name="redirect" type="hidden" value={redirect} />
      ) : null}

      <div className="card-body">
        <div className="form-control">
          <label htmlFor="email" className="label">
            <span className="label-text">Email</span>
          </label>
          <input
            name="email"
            id="email"
            type="email"
            autoComplete="current-email"
            placeholder="your@email.com"
            className={cn("input input-bordered", emailError && "input-error")}
            defaultValue={email}
            disabled={loggingIn}
          />
          {emailError ? (
            <label htmlFor="email" className="label">
              <span className="label-text-alt text-error">{emailError}</span>
            </label>
          ) : null}
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <input
            name="password"
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="password"
            className={cn(
              "input input-bordered",
              passwordError && "input-error"
            )}
            disabled={loggingIn}
          />
          {passwordError ? (
            <label htmlFor="password" className="label">
              <span className="label-text-alt text-error">{passwordError}</span>
            </label>
          ) : null}
          <label htmlFor="password" className="label">
            <Link to="reset-password" className="text-2xs underline">
              Forgot password?
            </Link>
          </label>
        </div>

        {genericError ? (
          <p className="mt-4 label-text-alt text-error">{genericError}</p>
        ) : null}

        <div className="form-control mt-6">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loggingIn}
          >
            Login
          </button>
        </div>
      </div>
    </Form>
  );
}
