import type { ActionFunction } from "remix";
import { redirect as redirectTo } from "remix";

import { cartSession, CartSessionKeys } from "~/sessions.server";

export let action: ActionFunction = async ({ request }) => {
  let session = await cartSession.getSession(request.headers.get("Cookie"));

  let formValues = new URLSearchParams(await request.text());
  let redirect = formValues.get("redirect") || "/cart";
  let productVariantId = formValues.get("productVariantId");
  let quantityString = formValues.get("quantity");

  if (quantityString) {
    if (productVariantId) {
      let quantity = Number.parseInt(quantityString, 10);
      quantity = quantity < 1 ? 1 : quantity;

      let lineItems: Record<string, number> =
        session.get(CartSessionKeys.lineItems) || {};

      session.set(CartSessionKeys.lineItems, {
        ...lineItems,
        [productVariantId]: quantity,
      });
    } else {
      session.flash(
        CartSessionKeys.updateCartError,
        "no product variant id provided"
      );
    }
  } else {
    session.flash(
      CartSessionKeys.updateCartError,
      "quantity must be greater than zero"
    );
  }

  return redirectTo(redirect, {
    headers: {
      "Set-Cookie": await cartSession.commitSession(session),
    },
  });
};
