import type { ActionFunction } from "remix";
import { redirect as redirectTo } from "remix";

import { authSession } from "~/sessions.server";

export let action: ActionFunction = async ({ request }) => {
  let url = new URL(request.url);
  let redirect = url.searchParams.get("redirect") || "/";

  let session = await authSession.getSession(request.headers.get("Cookie"));

  return redirectTo(redirect, {
    headers: {
      "Set-Cookie": await authSession.destroySession(session),
    },
  });
};
