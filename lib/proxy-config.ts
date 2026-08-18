/**
 * Proxy matcher configuration for route protection.
 *
 * This config is used with `unstable_doesMiddlewareMatch` in tests and is
 * exported as `config` from proxy.ts, so the tested pattern is the one the
 * app actually runs.
 *
 * Matches:
 *   - /dashboard/* (protected routes)
 *   - /api/* (API routes, except auth)
 *
 * Skips:
 *   - Next.js internals (_next/*)
 *   - Static files (favicon.ico, images, common asset extensions)
 *   - Public pages (login, register, public/*)
 */
/**
 * Canonical matcher string — must be kept identical to the literal used in
 * proxy.ts (`export const config`), because Next.js requires that object to be
 * statically analyzable and cannot follow an import.
 */
export const proxyMatcher =
  "/((?!api/auth|_next/static|_next/image|favicon\\.ico|login|register|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)";

export const proxyConfig = {
  matcher: [proxyMatcher],
}
