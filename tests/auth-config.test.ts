import { describe, expect, it } from "vitest";
import authConfig from "@/auth.config";

describe("auth config", () => {
  it("uses JWT sessions for credentials auth", () => {
    expect(authConfig.session?.strategy).toBe("jwt");
  });

  it("points sign-in requests to the login page", () => {
    expect(authConfig.pages?.signIn).toBe("/public/login");
  });

  it("stays edge-safe by not registering database-backed providers", () => {
    expect(authConfig.providers).toEqual([]);
  });
});
