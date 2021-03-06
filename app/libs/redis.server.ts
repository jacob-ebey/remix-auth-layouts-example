import { createClient } from "redis";

declare global {
  var redisClient: ReturnType<typeof createClient> | undefined;
}

let redis = (global.redisClient =
  global.redisClient ||
  createClient({
    url: process.env.REDIS_URL || process.env.FLY_REDIS_CACHE_URL,
  }));

export default redis;
