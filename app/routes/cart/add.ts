import type { ActionFunction } from "remix";
import { redirect as redirectTo } from "remix";

import { cartSession, CartSessionKeys } from "~/sessions.server";

export let action: ActionFunction = async ({ request }) => {
  let session = await cartSession.getSession(request.headers.get("Cookie"));

  let formValues = new URLSearchParams(await request.text());
  let redirect = formValues.get("redirect") || "/cart";
  let productVariantId = formValues.get("productVariantId");
  let countString = formValues.get("count") || "1";
  let count = Number.parseInt(countString, 10);
  count = count < 1 ? 1 : count;

  if (productVariantId) {
    session.flash(CartSessionKeys.addedToCart, "yes");

    let lineItems: Record<string, number> =
      session.get(CartSessionKeys.lineItems) || {};
    lineItems[productVariantId] = lineItems[productVariantId] || 0;
    lineItems[productVariantId] += count;
    session.set(CartSessionKeys.lineItems, lineItems);
  } else {
    session.flash(
      CartSessionKeys.addToCartError,
      "please select a product variant"
    );
  }

  return redirectTo(redirect, {
    headers: {
      "Set-Cookie": await cartSession.commitSession(session),
    },
  });
};
