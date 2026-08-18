import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Always allow public routes
  if (pathname.startsWith("/public") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protect all /dashboard/* pages — redirect to login if unauthenticated
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/public/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect all /api/* routes (except /api/auth/* handled above)
  // Return 401 JSON for unauthenticated API requests
  if (pathname.startsWith("/api")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

// Next.js requires this object to be statically analyzable, so the matcher
// must be a literal here. Keep it in sync with `proxyConfig` in
// lib/proxy-config.ts (used by tests/proxy.test.ts to assert the behavior).
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|login|register|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
