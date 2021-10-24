import type {
  ActionFunction,
  HeadersFunction,
  LoaderFunction,
  MetaFunction,
} from "remix";
import { Form, json, useActionData, useLoaderData, useTransition } from "remix";
import cn from "classnames";

import prisma from "~/libs/prisma.server";

import type { User } from "~/utils/auth.server";
import { requireUser, requireUserId } from "~/utils/auth.server";

export let meta: MetaFunction = () => {
  return {
    title: "Profile",
    description: "View your profile!",
  };
};

type ProfileLoaderData = {
  user: User;
};

export let loader: LoaderFunction = async ({ request }) => {
  let user = await requireUser(
    request.headers.get("Cookie"),
    "/login?redirect=/profile"
  );

  let result: ProfileLoaderData = { user };

  return json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
};

export let headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

type ProfileActionData = {
  firstName?: string;
  firstNameError?: string;
};

export let action: ActionFunction = async ({ request }) => {
  let url = new URL(request.url);
  let userId = await requireUserId(
    request.headers.get("Cookie"),
    `/login?redirect=${url.pathname}`
  );

  let formData = new URLSearchParams(await request.text());
  let firstName = formData.get("firstName")?.trim();
  let newsletter = !!formData.get("newsletter");

  let actionData: ProfileActionData = {
    firstName,
  };

  // validate input
  let hasError = false;
  if (!firstName) {
    hasError = true;
    actionData.firstNameError = "please provide your first name";
  }

  // bail early on error to show user
  if (hasError) {
    return json(actionData, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      newsletter,
    },
  });

  return null;
};

export default function Profile() {
  let { user } = useLoaderData<ProfileLoaderData>();
  let { firstName, firstNameError, newsletter } = useActionData() || {};
  let transition = useTransition();

  let saving = transition.state === "submitting";

  return (
    <div className="min-h-screen py-20 mx-auto">
      <div className="text-center hero-content mx-auto">
        <div>
          <h1 className="mb-5 text-5xl font-bold">Welcome {user.firstName}!</h1>

          <Form method="post" className="max-w-md mx-auto">
            <div className="form-control">
              <label htmlFor="firstName" className="label">
                <span className="label-text">First name</span>
              </label>
              <input
                disabled={saving}
                name="firstName"
                id="firstName"
                type="text"
                placeholder="Your name"
                className={cn(
                  "input input-bordered",
                  firstNameError && "input-error"
                )}
                defaultValue={firstName || user.firstName}
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
              <label className="cursor-pointer label">
                <span className="label-text text-2xs mr-2">
                  Subscribe to the newsletter?
                </span>
                <input
                  disabled={saving}
                  name="newsletter"
                  type="checkbox"
                  defaultChecked={
                    typeof newsletter === "undefined"
                      ? user.newsletter
                      : newsletter
                  }
                  className="toggle toggle-accent"
                />
              </label>
            </div>

            <div className="form-control mt-6">
              <button
                disabled={saving}
                type="submit"
                className="btn btn-primary"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
