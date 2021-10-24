import type { ActionFunction } from "remix";
import { redirect as redirectTo } from "remix";

import { cartSession, CartSessionKeys } from "~/sessions.server";

export let action: ActionFunction = async ({ request }) => {
  let session = await cartSession.getSession(request.headers.get("Cookie"));

  let formValues = new URLSearchParams(await request.text());
  let redirect = formValues.get("redirect") || "/cart";
  let productVariantId = formValues.get("productVariantId");
  let needsDelete = false;

  if (productVariantId) {
    let { [productVariantId]: _, ...lineItems }: Record<string, number> =
      session.get(CartSessionKeys.lineItems) || {};

    session.set(CartSessionKeys.lineItems, lineItems);

    if (!Object.keys(lineItems).length) {
      needsDelete = true;
    }
  } else {
    session.flash(
      CartSessionKeys.updateCartError,
      "no product variant id provided"
    );
  }

  return redirectTo(redirect, {
    headers: {
      "Set-Cookie": needsDelete
        ? await cartSession.destroySession(session)
        : await cartSession.commitSession(session),
    },
  });
};
