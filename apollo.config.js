module.exports = {
  client: {
    includes: ["./app/**/*.ts", "./app/**/*.tsx"],
    service: {
      name: "shopify",
      url: "https://graphql.myshopify.com/api/2021-10/graphql.json",
      headers: {
        "X-Shopify-Storefront-Access-Token":
          process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
          "dd4d4dc146542ba7763305d71d1b3d38",
      },
    },
  },
};
