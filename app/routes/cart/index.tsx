import type { LoaderFunction } from "remix";
import { json, useCatch, useLoaderData } from "remix";
import { Link } from "react-router-dom";

import type { ICart } from "~/commerce-provider";
import { RequestContext } from "~/context.server";
import { cartSession, CartSessionKeys } from "~/sessions.server";
import { formatPrice } from "~/utils/format";

import CartLineItem, { CartLineItemProps } from "~/components/cart-line-item";

type CartLoaderData = {
  cart: Omit<ICart, "lineItems"> & {
    lineItems: CartLineItemProps[];
  };
};

export let loader: LoaderFunction = async ({ context, request }) => {
  let { commerce } = context as RequestContext;

  let session = await cartSession.getSession(request.headers.get("Cookie"));
  let lineItems: Record<string, number> =
    session.get(CartSessionKeys.lineItems) || {};

  let count = Object.values(lineItems).reduce((r, c) => r + c, 0);

  session.get(CartSessionKeys.updateCartError);

  if (count <= 0) {
    throw new Response(null, { status: 404 });
  }

  let cart = await commerce.cartFromLineItems(lineItems);

  let result: CartLoaderData = {
    cart: {
      ...cart,
      lineItems: cart.lineItems.map((lineItem) => ({
        image: lineItem.summary.image,
        price: formatPrice(lineItem.itemPrice),
        productSlug: lineItem.summary.productSlug,
        productVariantId: lineItem.summary.productVariantId,
        quantity: lineItem.quantity,
        selectedOptions: lineItem.summary.selectedOptions,
        title: lineItem.summary.title,
        total: formatPrice(lineItem.total),
      })),
    },
  };

  return json(result);
};

export default function Cart() {
  let { cart } = useLoaderData<CartLoaderData>();

  return (
    <section className="min-h-screen">
      <div className="flex justify-center my-6">
        <div className="flex flex-col w-full p-8 bg-base-200 shadow-lg pin-r pin-y md:w-4/5 lg:w-4/5">
          <div className="flex-1">
            <h1 className="mb-6 text-4xl font-semibold">Cart</h1>
            <table className="w-full text-sm lg:text-base" cellSpacing="0">
              <thead>
                <tr className="h-12 uppercase">
                  <th className="hidden md:table-cell"></th>
                  <th className="text-left">Product</th>
                  <th className="lg:text-right text-left pl-5 lg:pl-0">
                    <span className="lg:hidden" title="Quantity">
                      Qtd
                    </span>
                    <span className="hidden lg:inline">Quantity</span>
                  </th>
                  <th className="hidden text-right md:table-cell">
                    Unit price
                  </th>
                  <th className="text-right">Total price</th>
                </tr>
              </thead>
              <tbody>
                {cart.lineItems.map((lineItem) => (
                  <CartLineItem {...lineItem} key={lineItem.productVariantId} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  if (caught.status !== 404) {
    throw new Error("unexpected thrown response in the routes/cart/index");
  }

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="text-center hero-content">
        <div className="max-w-md">
          <h1 className="mb-5 text-5xl font-bold">Cart Not Found 😥</h1>
          <p className="mb-5">
            Looks like you haven't added anything to your cart yet. Try heading
            back to the{" "}
            <Link to="/" className="underline">
              home page
            </Link>{" "}
            to start shopping!
          </p>
        </div>
      </div>
    </div>
  );
}
