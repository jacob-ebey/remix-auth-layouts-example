import type { ActionFunction, MetaFunction } from "remix";
import {
  Form,
  json,
  redirect as redirectTo,
  useActionData,
  useTransition,
} from "remix";
import { useLocation } from "react-router-dom";
import cn from "classnames";

import prisma from "~/libs/prisma.server";

import { authSession } from "~/sessions.server";
import { signup } from "~/utils/auth.server";

export let meta: MetaFunction = () => {
  return {
    title: "Signup",
    description: "Look at how awesome this signup flow is!",
  };
};

type SignupActionData = {
  genericError?: string;
  email?: string;
  emailError?: string;
  firstName?: string;
  firstNameError?: string;
  passwordError?: string;
  newsletter?: boolean;
  redirect?: string;
};

export let action: ActionFunction = async ({ request }) => {
  let formValues = new URLSearchParams(await request.text());
  let redirect = formValues.get("redirect");
  let email = formValues.get("email")?.trim();
  let firstName = formValues.get("firstName")?.trim();
  let password = formValues.get("password");
  let verifyPassword = formValues.get("verifyPassword");
  let newsletter = !!formValues.get("newsletter");

  let actionData: SignupActionData = {
    email: email || undefined,
    firstName: firstName || undefined,
    newsletter: newsletter || undefined,
    redirect: redirect || undefined,
  };

  // validate input
  let hasError = false;
  if (!email || !email.match(/(.+)@(.+){2,}\.(.+){2,}/)) {
    hasError = true;
    actionData.emailError = "please provide a valid email";
  }
  if (!firstName) {
    hasError = true;
    actionData.firstNameError = "please provide your first name";
  }
  if (!password) {
    hasError = true;
    actionData.passwordError = "please provide a password";
  } else if (password.length < 6) {
    hasError = true;
    actionData.passwordError = "password must be at least 6 characters long";
  } else if (password !== verifyPassword) {
    hasError = true;
    actionData.passwordError = "passwords do not match";
  }

  // bail early on error to show user
  if (hasError) {
    return json(actionData, { status: 400 });
  }

  email = email as string;
  password = password as string;
  firstName = firstName as string;

  let existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return redirectTo(
      `/login?email=${encodeURIComponent(email)}` +
        (redirect ? `&redirect=${encodeURIComponent(redirect)}` : "")
    );
  }

  let user = await signup({ email, firstName, newsletter }, password);

  if (!user) {
    actionData.genericError = "failed to signup";
    return json(actionData, { status: 500 });
  }

  let session = await authSession.getSession(request.headers.get("Cookie"));
  session.set("userId", user.id);

  return redirectTo(redirect || "/", {
    headers: {
      "Set-Cookie": await authSession.commitSession(session),
    },
  });
};

export default function Signup() {
  let {
    genericError,
    email,
    emailError,
    firstName,
    firstNameError,
    passwordError,
    newsletter,
    redirect,
  } = useActionData<SignupActionData>() || {};

  let transition = useTransition();

  let location = useLocation();
  let searchParams = new URLSearchParams(location.search);
  redirect = searchParams.get("redirect") || redirect;

  let signingUp = transition.state === "submitting";

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
          <label htmlFor="firstName" className="label">
            <span className="label-text">First name</span>
          </label>
          <input
            name="firstName"
            id="firstName"
            type="text"
            placeholder="Your name"
            className={cn(
              "input input-bordered",
              firstNameError && "input-error"
            )}
            defaultValue={firstName}
            disabled={signingUp}
          />
          {firstNameError ? (
            <label htmlFor="email" className="label">
              <span className="label-text-alt text-error">
                {firstNameError}
              </span>
            </label>
          ) : null}
        </div>
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
            disabled={signingUp}
          />
          {emailError ? (
            <label htmlFor="email" className="label">
              <span className="label-text-alt text-error">{emailError}</span>
            </label>
          ) : null}
        </div>
        <div className="form-control">
          <label htmlFor="password" className="label">
            <span className="label-text">Password</span>
          </label>
          <input
            name="password"
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="password"
            className={cn(
              "input input-bordered",
              passwordError && "input-error"
            )}
            disabled={signingUp}
          />
          {passwordError ? (
            <label htmlFor="password" className="label">
              <span className="label-text-alt text-error">{passwordError}</span>
            </label>
          ) : null}
        </div>
        <div className="form-control">
          <label htmlFor="verifyPassword" className="label">
            <span className="label-text">Verify password</span>
          </label>
          <input
            name="verifyPassword"
            id="verifyPassword"
            type="password"
            autoComplete="new-password"
            placeholder="verify password"
            className={cn(
              "input input-bordered",
              passwordError && "input-error"
            )}
            disabled={signingUp}
          />
        </div>

        {genericError ? (
          <p className="mt-4 label-text-alt text-error">{genericError}</p>
        ) : null}

        <div className="form-control">
          <label className="cursor-pointer label">
            <span className="label-text text-2xs mr-2">
              Subscribe to the newsletter?
            </span>
            <input
              name="newsletter"
              type="checkbox"
              defaultChecked={newsletter}
              className="toggle toggle-accent"
              disabled={signingUp}
            />
          </label>
        </div>

        <div className="form-control mt-6">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={signingUp}
          >
            Login
          </button>
        </div>
      </div>
    </Form>
  );
}
