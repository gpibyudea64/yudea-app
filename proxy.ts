import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const runtime = "edge";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/public/login", req.url));
  }

  if (isLoggedIn && pathname.startsWith("/public/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return;
});

export const config = {
  matcher: ["/dashboard/:path*", "/public/login"],
};
