import { Fragment } from "react";
import type { LoaderFunction } from "remix";
import { Form, json, useLoaderData, useTransition } from "remix";
import { Location, To } from "history";
import { Link, useLocation } from "react-router-dom";
import cn from "classnames";

import type { IProductDetails, ISelectedOption } from "commerce-provider";

import type { RequestContext } from "~/context.server";
import { swrHeaders } from "~/utils/headers.server";
import { formatPrice, formatPriceRange } from "~/utils/format";
import { cartSession, CartSessionKeys } from "~/sessions.server";

type PdpLoaderData = {
  addedToCart?: boolean;
  addToCartError?: string;
  updateCartError?: string;
  productDetails: IProductDetails;
};

export let loader: LoaderFunction = async ({ context, request, params }) => {
  let { commerce } = context as RequestContext;

  let url = new URL(request.url);
  let session = await cartSession.getSession(request.headers.get("Cookie"));

  let selectedOptions: ISelectedOption[] = [];
  url.searchParams.forEach((value, name) => {
    selectedOptions.push({
      name,
      value,
    });
  });

  let productDetails = await commerce.productDetails(
    params.slug!,
    selectedOptions
  );

  let result = {
    addedToCart: session.get(CartSessionKeys.addedToCart),
    addToCartError: session.get(CartSessionKeys.addToCartError),
    updateCartError: session.get(CartSessionKeys.updateCartError),
    productDetails,
  };

  return json(result, {
    headers: {
      "Cache-Control": "stale-while-revalidate, s-maxage=60",
      "Set-Cookie": await cartSession.commitSession(session),
    },
  });
};

export let headers = swrHeaders;

export let cacheKey = async (request: Request) => {
  let session = await cartSession.getSession(request.headers.get("Cookie"));

  let addedToCart = session.get(CartSessionKeys.addedToCart);
  let addToCartError = session.get(CartSessionKeys.addToCartError);

  return `addedToCart: ${addedToCart} | addToCartError: ${addToCartError}`;
};

export default function PDP() {
  let {
    addedToCart,
    addToCartError,
    updateCartError,
    productDetails: { title, priceRange, images, options, selectedVariant },
  } = useLoaderData<PdpLoaderData>();

  let transition = useTransition();

  let location = useLocation();
  let search = new URLSearchParams(location.search);

  let addToCartDisabled = transition.state !== "idle" || !selectedVariant?.id;

  return (
    <main>
      {addedToCart ? (
        <div className="alert alert-success">
          <div className="flex-1">
            <p>Added to cart!</p>
          </div>
        </div>
      ) : addToCartError || updateCartError ? (
        <div className="alert alert-error">
          <div className="flex-1">
            <p>{addToCartError || updateCartError}</p>
          </div>
        </div>
      ) : null}
      <section className="hero min-h-screen">
        <div className="md:w-4/5 mx-auto flex flex-wrap">
          <div className="md:w-1/2 w-full">
            <div className="aspect-w-4 aspect-h-5">
              <img
                alt="ecommerce"
                className="object-cover object-center rounded border border-gray-200"
                src={images[0]}
              />
            </div>
          </div>
          <div className="md:w-1/2 w-full md:pl-10 md:py-6 mt-6 md:mt-0">
            <h1 className="text-4xl title-font font-medium mb-4">{title}</h1>
            <p className="text-2xl mb-6">
              {selectedVariant
                ? formatPrice(selectedVariant.price, true)
                : formatPriceRange(priceRange)}{" "}
              <span className="text-sm font-semibold">
                {selectedVariant
                  ? selectedVariant.price.currencyCode
                  : priceRange.currencyCode}
              </span>
            </p>
            <p className="leading-relaxed">
              Fam locavore kickstarter distillery. Mixtape chillwave tumeric
              sriracha taximy chia microdosing tilde DIY. XOXO fam indxgo
              juiceramps cornhole raw denim forage brooklyn. Everyday carry +1
              seitan poutine tumeric. Gastropub blue bottle austin listicle
              pour-over, neutra jean shorts keytar banjo tattooed umami
              cardigan.
            </p>

            <div className="mt-6">
              {options.map((option) => (
                <Fragment key={option.id}>
                  <p>{option.name}:</p>

                  <div
                    role="tablist"
                    className="btn-group mb-4"
                    aria-label={option.name}
                  >
                    {option.values.map((value) => (
                      <Link
                        aria-selected={
                          search.get(option.name) === value ? "true" : undefined
                        }
                        key={`${option.name}|${value}`}
                        className={cn(
                          "btn",
                          search.get(option.name) === value && "btn-active"
                        )}
                        to={convertOptionToLinkTo(location, option.name, value)}
                      >
                        {value}
                      </Link>
                    ))}
                  </div>
                </Fragment>
              ))}
            </div>

            <div className="flex mt-12">
              <Form method="post" action="/cart/add">
                <input
                  name="redirect"
                  type="hidden"
                  value={location.pathname}
                />
                <input
                  name="productVariantId"
                  type="hidden"
                  value={selectedVariant?.id || ""}
                />
                <button
                  type="submit"
                  disabled={addToCartDisabled}
                  className="btn btn-accent"
                >
                  Add to cart
                </button>
              </Form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function convertOptionToLinkTo(
  location: Location,
  name: string,
  value: string
): To {
  let search = new URLSearchParams(location.search);
  search.set(name, value);

  return {
    pathname: location.pathname,
    search: search.toString(),
  };
}
