import type { ICommerceProvider } from "commerce-provider";

export default function createCommerceProviderMock(): ICommerceProvider {
  return {
    async allCollections() {
      return [
        {
          id: "collection-1",
          slug: "collection-1",
          title: "Collection 1",
        },
      ];
    },
    async allProducts() {
      return {
        cursor: "cursor",
        hasNextPage: false,
        hasPreviousPage: false,
        products: [
          {
            id: "product-1",
            slug: "product-1",
            title: "Product 1",
            image: "",
            priceRange: {
              currencyCode: "USD",
              max: "100",
            },
          },
        ],
      };
    },
    async cartFromLineItems() {
      return {
        lineItems: [
          {
            itemPrice: {
              amount: "100",
              currencyCode: "USD",
            },
            quantity: 1,
            summary: {
              image: "",
              title: "Product 1",
              productSlug: "product-1",
              productVariantId: "variant-1",
              selectedOptions: [
                { name: "Color", value: "Black" },
                { name: "Size", value: "10" },
              ],
            },
            total: {
              amount: "100",
              currencyCode: "USD",
            },
          },
        ],
        total: {
          amount: "100",
          currencyCode: "USD",
        },
      };
    },
    async collectionPage() {
      return {
        cursor: "cursor",
        hasNextPage: false,
        hasPreviousPage: false,
        id: "collection-1",
        slug: "collection-1",
        title: "Collection 1",
        products: [
          {
            id: "product-1",
            slug: "product-1",
            title: "Product 1",
            image: "",
            priceRange: {
              currencyCode: "USD",
              max: "100",
            },
          },
        ],
      };
    },
    async productDetails() {
      return {
        id: "product-1",
        slug: "product-1",
        title: "Product 1",
        image: "",
        images: [""],
        priceRange: {
          currencyCode: "USD",
          max: "100",
        },
        options: [
          {
            id: "color",
            name: "Color",
            values: ["Black", "Blue"],
          },
          {
            id: "size",
            name: "Size",
            values: ["10", "12"],
          },
        ],
        selectedVariant: {
          id: "variant-1",
          price: {
            amount: "100",
            currencyCode: "USD",
          },
        },
      };
    },
  };
}
