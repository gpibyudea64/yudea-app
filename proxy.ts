import { NextResponse } from "next/server";

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // read cookies manually (NO auth() here)
  const cookie = req.headers.get("cookie") || "";
  const isLoggedIn =
    cookie.includes("next-auth.session-token") ||
    cookie.includes("__Secure-next-auth.session-token");

  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/public/login", req.url));
  }

  if (isLoggedIn && pathname === "/public/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}
