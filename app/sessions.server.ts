import { createCookieSessionStorage } from "remix";

export let authSession = createCookieSessionStorage({
  cookie: {
    name: "auth",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    secrets: [process.env.COOKIE_SECRET!],
  },
});
