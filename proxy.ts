import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  console.log(pathname, token);

  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/public/login", req.url));
  }

  if (token && pathname === "/public/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/public/login"],
};
