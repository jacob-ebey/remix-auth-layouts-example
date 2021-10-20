module.exports = {
  extensions: {
    endpoints: {
      default: {
        url: "https://graphql.myshopify.com/api/graphql",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token":
            "dd4d4dc146542ba7763305d71d1b3d38",
        },
      },
    },
  },
};
