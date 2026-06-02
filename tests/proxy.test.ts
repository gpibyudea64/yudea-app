import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { proxyConfig } from "@/lib/proxy-config";
import nextConfig from "@/next.config";

describe("proxy config", () => {
  it("runs for app pages that need auth redirects", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config: proxyConfig,
        nextConfig,
        url: "/dashboard/members",
      }),
    ).toBe(true);
  });

  it("skips Next internals and favicon requests", () => {
    for (const url of [
      "/_next/static/chunks/app.js",
      "/_next/image?url=%2Flogo.png&w=128&q=75",
      "/favicon.ico",
    ]) {
      expect(
        unstable_doesMiddlewareMatch({
          config: proxyConfig,
          nextConfig,
          url,
        }),
      ).toBe(false);
    }
  });
});
