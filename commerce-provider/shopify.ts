import dinero from "dinero.js";

import {
  AllCollectionsQuery,
  AllCollectionsQueryVariables,
  AllProductsQuery,
  AllProductsQueryVariables,
  CartFromLineItemsQuery,
  CartFromLineItemsQueryVariables,
  CollectionPageQuery,
  CollectionPageQueryVariables,
  MoneyV2,
  ProductDetailsQuery,
  ProductDetailsQueryVariables,
} from "./graphql/shopify";

import type { ICommerceProvider, IMoneyRange, ICartLineItem } from "./index";

function variantsToPriceRange(
  productsVariants: {
    node: {
      priceV2: MoneyV2;
    };
  }[]
): IMoneyRange {
  let max = Number.MIN_VALUE;
  let maxString: string | undefined;
  let min: number = Number.MAX_VALUE;
  let minString: string | undefined;
  let currencyCode: string | undefined;

  for (let { node: variant } of productsVariants) {
    currencyCode = variant.priceV2.currencyCode;
    let amount = Number.parseFloat(variant.priceV2.amount);

    if (amount < min) {
      min = amount;
      minString = variant.priceV2.amount;
    }
    if (amount > max) {
      max = amount;
      maxString = variant.priceV2.amount;
    }
  }

  if (!currencyCode || !maxString) {
    throw new Error("could not determine price range");
  }

  if (max === min) {
    minString = undefined;
  }

  return {
    max: maxString,
    min: minString,
    currencyCode,
  };
}

export default function createShopifyProvider({
  storefrontAccessToken,
}: CreateShopifyProviderOptions): ICommerceProvider {
  let request = createRequestFunction(storefrontAccessToken);

  return {
    async allCollections() {
      let result = await request<
        AllCollectionsQuery,
        AllCollectionsQueryVariables
      >(
        gql`
          query AllCollections {
            collections(first: 100) {
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
              edges {
                node {
                  id
                  title
                  slug: handle
                }
              }
            }
          }
        `
      );

      if (!result.data?.collections) {
        if (result.errors?.[0]) {
          throw new Error(result.errors[0].message);
        }

        throw new Response(null, { status: 404 });
      }

      return result.data.collections.edges.map(
        ({ node: { id, slug, title } }) => ({
          id,
          slug,
          title,
        })
      );
    },
    async collectionPage(slug, perPage, cursor = null) {
      let result = await request<
        CollectionPageQuery,
        CollectionPageQueryVariables
      >(
        gql`
          query CollectionPage($slug: String, $cursor: String, $perPage: Int) {
            collection(handle: $slug) {
              id
              slug: handle
              title
              products(first: $perPage, after: $cursor) {
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                }
                edges {
                  cursor
                  node {
                    id
                    slug: handle
                    title
                    images(first: 1) {
                      edges {
                        node {
                          transformedSrc(maxWidth: 600)
                        }
                      }
                    }
                    variants(first: 100) {
                      edges {
                        node {
                          priceV2 {
                            amount
                            currencyCode
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        {
          slug,
          cursor,
          perPage,
        }
      );

      if (!result.data?.collection?.products?.edges.length) {
        if (result.errors?.[0]) {
          throw new Error(result.errors[0].message);
        }

        throw new Response(null, { status: 404 });
      }

      let collection = result.data.collection;

      return {
        id: collection.id,
        slug: collection.slug,
        title: collection.title,
        hasNextPage: collection.products.pageInfo.hasNextPage,
        hasPreviousPage: collection.products.pageInfo.hasPreviousPage,
        cursor:
          collection.products.edges[collection.products.edges.length - 1]
            .cursor,
        products: collection.products.edges.map(
          ({
            node: {
              id,
              slug,
              title,
              variants: { edges: variants },
              images: {
                edges: [
                  {
                    node: { transformedSrc: image },
                  },
                ],
              },
            },
          }) => ({
            id,
            slug,
            title,
            image,
            priceRange: variantsToPriceRange(variants),
          })
        ),
      };
    },
    async allProducts(perPage, cursor = null) {
      let result = await request<AllProductsQuery, AllProductsQueryVariables>(
        gql`
          query AllProducts($perPage: Int, $cursor: String) {
            products(first: $perPage, after: $cursor) {
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
              edges {
                cursor
                node {
                  id
                  slug: handle
                  title
                  images(first: 1) {
                    edges {
                      node {
                        transformedSrc(maxWidth: 600)
                      }
                    }
                  }
                  variants(first: 100) {
                    edges {
                      node {
                        priceV2 {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        {
          cursor,
          perPage,
        }
      );

      if (!result.data?.products?.edges?.length) {
        if (result.errors?.[0]) {
          throw new Error(result.errors[0].message);
        }

        throw new Response(null, { status: 404 });
      }

      return {
        cursor:
          result.data.products.edges[result.data.products.edges.length - 1]
            .cursor,
        hasNextPage: result.data.products.pageInfo.hasNextPage,
        hasPreviousPage: result.data.products.pageInfo.hasPreviousPage,
        products: result.data.products.edges.map(({ node: product }) => ({
          id: product.id,
          slug: product.slug,
          title: product.title,
          image: product.images.edges[0].node.transformedSrc,
          priceRange: variantsToPriceRange(product.variants.edges),
        })),
      };
    },
    async cartFromLineItems(lineItemsObj) {
      let ids = Object.keys(lineItemsObj);

      let result = await request<
        CartFromLineItemsQuery,
        CartFromLineItemsQueryVariables
      >(
        gql`
          query CartFromLineItems($ids: [ID!]!) {
            nodes(ids: $ids) {
              __typename
              id
              ... on ProductVariant {
                image {
                  transformedSrc(maxWidth: 90)
                }
                product {
                  slug: handle
                  title
                  images(first: 1) {
                    edges {
                      node {
                        transformedSrc(maxWidth: 300)
                      }
                    }
                  }
                }
                priceV2 {
                  amount
                  currencyCode
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        `,
        {
          ids,
        }
      );

      if (!result.data?.nodes?.length) {
        if (result.errors?.[0]) {
          throw new Error(result.errors[0].message);
        }

        throw new Response(null, { status: 404 });
      }

      let lineItems = result.data.nodes.map<ICartLineItem>((node, index) => {
        if (node?.__typename !== "ProductVariant") {
          throw new Error(`invalid product variant ${ids[index]}`);
        }

        let quantity = lineItemsObj[node.id];

        let dineroTotal = dinero({
          amount: Number.parseFloat(node.priceV2.amount),
          currency: node.priceV2.currencyCode as any,
        }).multiply(quantity);

        return {
          summary: {
            productSlug: node.product.slug,
            productVariantId: node.id,
            title: node.product.title,
            image:
              node.image?.transformedSrc ||
              node.product.images.edges[0].node.transformedSrc,
            selectedOptions: node.selectedOptions.map(({ name, value }) => ({
              name,
              value,
            })),
          },
          itemPrice: {
            amount: node.priceV2.amount,
            currencyCode: node.priceV2.currencyCode,
          },
          quantity,
          total: {
            amount: dineroTotal.getAmount().toFixed(dineroTotal.getPrecision()),
            currencyCode: node.priceV2.currencyCode,
          },
        };
      });

      let dineroTotal = dinero({
        amount: 0,
        currency: lineItems[0].total.currencyCode as any,
      });
      for (let lineItem of lineItems) {
        let dineroLineItemTotal = dinero({
          amount: Number.parseFloat(lineItem.total.amount),
          currency: lineItem.total.currencyCode as any,
        });
        dineroTotal = dineroTotal.add(dineroLineItemTotal);
      }

      return {
        lineItems,
        total: {
          amount: dineroTotal.getAmount().toFixed(dineroTotal.getPrecision()),
          currencyCode: dineroTotal.getCurrency(),
        },
      };
    },
    async productDetails(slug, selectedOptions = []) {
      let result = await request<
        ProductDetailsQuery,
        ProductDetailsQueryVariables
      >(
        gql`
          query ProductDetails(
            $slug: String
            $selectedOptions: [SelectedOptionInput!]!
          ) {
            product(handle: $slug) {
              id
              handle
              title
              images(first: 20) {
                edges {
                  node {
                    transformedSrc(maxWidth: 800, crop: CENTER)
                  }
                }
              }
              options {
                id
                name
                values
              }
              variantBySelectedOptions(selectedOptions: $selectedOptions) {
                id
                priceV2 {
                  amount
                  currencyCode
                }
              }
              variants(first: 100) {
                edges {
                  node {
                    priceV2 {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        `,
        {
          slug,
          selectedOptions,
        }
      );

      if (!result.data?.product) {
        if (result.errors?.[0]) {
          throw new Error(result.errors[0].message);
        }

        throw new Response(null, { status: 404 });
      }

      let product = result.data.product;

      return {
        id: product.id,
        slug: product.handle,
        title: product.title,
        image: product.images.edges[0].node.transformedSrc,
        images: product.images.edges.map((edge) => edge.node.transformedSrc),
        priceRange: variantsToPriceRange(product.variants.edges),
        options: product.options.map((option) => ({
          id: option.id,
          name: option.name,
          values: option.values,
        })),
        selectedVariant: product.variantBySelectedOptions
          ? {
              id: product.variantBySelectedOptions.id,
              price: {
                amount: product.variantBySelectedOptions.priceV2.amount,
                currencyCode:
                  product.variantBySelectedOptions.priceV2.currencyCode,
              },
            }
          : undefined,
      };
    },
  };
}

function createRequestFunction(storefrontAccessToken: string) {
  return async function request<TData, TVariables = Record<string, any>>(
    query: string,
    variables?: TVariables
  ): Promise<{ data?: TData; errors?: GraphqlError[] }> {
    let response = await gqlFetch(
      "https://graphql.myshopify.com/api/2021-10/graphql.json",
      query,
      variables,
      {
        headers: {
          "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
        },
      }
    );

    return response.json();
  };
}

function gql(strings: TemplateStringsArray, ...values: any[]) {
  let str = strings[0];
  strings.slice(1).forEach((string, i) => {
    str += string + values[i];
  });
  return str.replace(/\s{0,}\n\s{0,}/g, " ").trim();
}

function gqlFetch(
  url: string,
  query: string,
  variables?: Record<string, any>,
  init?: RequestInit
) {
  let headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  return fetch(url, {
    ...init,
    method: "POST",
    body: JSON.stringify({ query, variables }),
    headers,
  });
}

interface GraphqlError {
  message: string;
}

type CreateShopifyProviderOptions = {
  storefrontAccessToken: string;
};
