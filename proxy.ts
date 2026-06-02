import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname.startsWith("/public/login");

  // ignore all api routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/public/login", req.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
