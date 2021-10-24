import crypto from "crypto";

import { createCookieSessionStorage, createSessionStorage } from "remix";

import redis from "./libs/redis.server";

export let authSession = createCookieSessionStorage({
  cookie: {
    name: "auth",
    path: "/",
    httpOnly: true,
    sameSite: true,
    secure: process.env.NODE_ENV !== "development",
    secrets: [process.env.COOKIE_SECRET!],
  },
});

export let CartSessionKeys = {
  addedToCart: "addedToCart",
  addToCartError: "addToCartError",
  updateCartError: "updateCartError",
  lineItems: "lineItems",
};

export let cartSession = createSessionStorage({
  cookie: {
    name: "cart",
    path: "/",
    httpOnly: true,
    sameSite: true,
    secure: process.env.NODE_ENV !== "development",
    secrets: [process.env.COOKIE_SECRET!],
  },
  async createData(data, expires) {
    let content = JSON.stringify(data);

    let id: string;
    while (true) {
      let randomBytes = crypto.randomBytes(8);
      id = "cart-" + Buffer.from(randomBytes).toString("hex");

      if (
        await new Promise((resolve, reject) => {
          redis.exists(id, (error, num) => {
            if (error) reject(error);
            else resolve(num);
          });
        })
      ) {
        continue;
      }

      if (typeof expires !== "undefined") {
        let maxAge = expires.getTime() - new Date().getTime();
        maxAge = maxAge < 0 ? 0 : maxAge;
        await new Promise<void>((resolve, reject) => {
          redis.set(id, content, "PX", maxAge, (err) => {
            if (err) return reject(err);
            return resolve();
          });
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          redis.set(id, content, (err) => {
            if (err) return reject(err);
            return resolve();
          });
        });
      }
      break;
    }

    return id;
  },
  async updateData(id, data, expires) {
    let content = JSON.stringify(data);

    if (typeof expires !== "undefined") {
      let maxAge = expires.getTime() - new Date().getTime();
      maxAge = maxAge < 0 ? 0 : maxAge;
      await new Promise<void>((resolve, reject) => {
        redis.set(id, content, "PX", maxAge, (err) => {
          if (err) return reject(err);
          return resolve();
        });
      });
    } else {
      await new Promise<void>((resolve, reject) => {
        redis.set(id, content, (err) => {
          if (err) return reject(err);
          return resolve();
        });
      });
    }
  },
  readData(id) {
    return new Promise((resolve, reject) => {
      redis.get(id, (err, content) => {
        if (err) return reject(err);
        return resolve(content ? JSON.parse(content) : null);
      });
    });
  },
  async deleteData(id) {
    return new Promise<void>((resolve, reject) => {
      redis.del(id, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  },
});
