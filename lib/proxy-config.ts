/**
 * Proxy / middleware matcher configuration for route protection.
 *
 * This config is used with `unstable_doesMiddlewareMatch` in tests
 * and corresponds to the standard Next.js middleware `config.matcher` pattern.
 *
 * Matches:
 *   - /dashboard/* (protected routes)
 *   - /api/* (API routes, except auth)
 *
 * Skips:
 *   - Next.js internals (_next/*)
 *   - Static files (favicon.ico, images)
 *   - Public pages (login, register, public/*)
 */
export const proxyConfig = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|login|register|public).*)",
  ],
}
