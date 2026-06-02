import { describe, expect, it } from "vitest";
import {
  canEditPath,
  canViewPath,
  getDefaultDashboardPath,
  getRouteAccessForPath,
  normalizeAppRole,
  parseRoleAccessConfig,
  resolveRoleAccessConfig,
} from "@/lib/rbac";

describe("rbac utilities", () => {
  it("normalizes known and custom roles", () => {
    expect(normalizeAppRole(" admin ")).toBe("ADMIN");
    expect(normalizeAppRole("coordinator")).toBe("COORDINATOR");
    expect(normalizeAppRole("guest")).toBe("GUEST");
    expect(normalizeAppRole(null)).toBe("");
  });

  it("keeps settings locked to administrators even with overrides", () => {
    const config = resolveRoleAccessConfig({
      "/dashboard/settings": {
        view: ["STAFF"],
        edit: ["STAFF"],
      },
    });

    expect(config["/dashboard/settings"]).toEqual({
      view: ["ADMIN"],
      edit: ["ADMIN"],
    });
  });

  it("matches the most specific route for nested paths", () => {
    const access = getRouteAccessForPath("/dashboard/members/123");

    expect(access).toEqual({
      view: ["ADMIN", "STAFF", "COORDINATOR", "MEMBER"],
      edit: ["ADMIN", "STAFF", "COORDINATOR"],
    });
  });

  it("parses legacy and current role access JSON", () => {
    const config = parseRoleAccessConfig(
      JSON.stringify({
        "/dashboard/members": ["ADMIN"],
        "/dashboard/families": {
          view: ["COORDINATOR"],
          edit: ["ADMIN"],
        },
      }),
    );

    expect(config["/dashboard/members"]).toEqual({
      view: ["ADMIN"],
      edit: [],
    });
    expect(config["/dashboard/families"]).toEqual({
      view: ["COORDINATOR"],
      edit: ["ADMIN"],
    });
  });

  it("checks view and edit permissions", () => {
    expect(canViewPath("member", "/dashboard/members")).toBe(true);
    expect(canEditPath("member", "/dashboard/members")).toBe(false);
    expect(canEditPath("staff", "/dashboard/members")).toBe(true);
    expect(canViewPath(undefined, "/dashboard/members")).toBe(false);
  });

  it("chooses role-specific dashboard destinations", () => {
    expect(getDefaultDashboardPath("MEMBER")).toBe("/dashboard/members");
    expect(getDefaultDashboardPath("COORDINATOR")).toBe("/dashboard/families");
    expect(getDefaultDashboardPath("ADMIN")).toBe("/dashboard");
  });
});
