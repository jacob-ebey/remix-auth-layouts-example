import { gqlFetch } from "~/utils/gql";

export interface GraphqlError {
  message: string;
}

export default async function shopify<TData, TVariables = Record<string, any>>(
  query: string,
  variables?: TVariables
): Promise<{ data?: TData; errors?: GraphqlError[] }> {
  let response = await gqlFetch(
    "https://graphql.myshopify.com/api/graphql",
    query,
    variables,
    {
      headers: {
        "X-Shopify-Storefront-Access-Token":
          process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
      },
    }
  );

  return response.json();
}
