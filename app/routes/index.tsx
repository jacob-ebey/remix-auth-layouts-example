import type { HeadersFunction, LoaderFunction } from "remix";
import { json, useLoaderData } from "remix";
import { Link } from "react-router-dom";

import type { IProduct } from "commerce-provider";

import type { RequestContext } from "~/context.server";
import { formatPriceRange } from "~/utils/format";

import type { ProductCardProps } from "~/components/product-card";
import ProductCard from "~/components/product-card";

type IndexLoaderData = {
  products: ProductCardProps[];
};

function productToProductCardProps(product: IProduct): ProductCardProps {
  return {
    currencyCode: product.priceRange.currencyCode,
    price: formatPriceRange(product.priceRange),
    image: product.image,
    title: product.title,
    to: `/p/${product.slug}`,
    new: false,
  };
}

export let loader: LoaderFunction = async ({ context }) => {
  let { commerce } = context as RequestContext;

  let productPage = await commerce.allProducts(16);

  if (!productPage?.products?.length) {
    throw new Error("shopify did not return any products");
  }

  let result: IndexLoaderData = {
    products: productPage.products.map(productToProductCardProps),
  };

  return json(result, {
    headers: {
      "Cache-Control": "stale-while-revalidate, s-maxage=10",
    },
  });
};

export let headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export default function Index() {
  let { products } = useLoaderData<IndexLoaderData>();

  return (
    <main>
      <section className="hero min-h-screen bg-base-200">
        <div className="text-center hero-content">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold">Welcome to Remix!</h1>
            <p className="mb-5">
              This is an example on how you can implement an awesome login flow.{" "}
              <a className="underline" href="https://docs.remix.run">
                Check out the Remix docs
              </a>{" "}
              to learn more about Remix.
            </p>
            <p className="btn-group inline-block">
              <Link to="signup" className="btn btn-primary">
                Signup
              </Link>
              <Link to="login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="profile" className="btn btn-warning">
                Profile
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {products.map((props) => (
          <ProductCard lazy key={props.to} {...props} />
        ))}
      </section>
    </main>
  );
}
