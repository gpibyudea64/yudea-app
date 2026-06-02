import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // protect dashboard
  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/public/login", req.url));
  }

  // prevent logged-in users from visiting login
  if (isLoggedIn && pathname.startsWith("/public/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // IMPORTANT: explicitly continue
  return;
});

export const config = {
  matcher: ["/dashboard/:path*", "/public/login"],
};
