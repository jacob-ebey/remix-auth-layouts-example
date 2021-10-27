export default function createRedisMock() {
  let redisCache: Record<string, string | undefined> = {};

  return {
    createClient() {
      return {
        exists(key: string, cb: (error: Error | null, count: number) => void) {
          cb(null, typeof redisCache[key] !== "undefined" ? 1 : 0);
        },
        get(
          key: string,
          cb: (error: Error | null, value: string | null) => void
        ) {
          cb(null, redisCache[key] || null);
        },
        set() {
          let [key, value] = arguments;
          redisCache[key] = value;
          arguments[arguments.length - 1](null);
        },
        del() {
          for (let arg of arguments) {
            if (typeof arg === "string") {
              redisCache[arg] = undefined;
            } else if (typeof arg === "function") {
              arg(null, 1);
            }
          }
        },
      };
    },
  };
}
