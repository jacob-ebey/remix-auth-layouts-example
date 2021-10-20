require("dotenv").config();

let { createClient } = require("redis");

let redis = createClient({
  url: process.env.REDIS_URL,
});

redis.flushall(() => {
  console.log("redis cache cleared");
  process.exit(0);
});
