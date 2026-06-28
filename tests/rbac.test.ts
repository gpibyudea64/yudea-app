import { describe, expect, it } from "vitest";
import {
  canEditPath,
  canViewPath,
  configToViewMap,
  getAllowedRolesForPath,
  getAllowedRolesForPathFromConfig,
  getDefaultDashboardPath,
  getEditRolesForPath,
  getProtectedRouteItems,
  getRouteAccessForPath,
  hasRequiredRole,
  normalizeAppRole,
  parseRoleAccessConfig,
  parseRoleAccessMap,
  resolveRoleAccessConfig,
  serializeRoleAccessConfig,
  serializeRoleAccessMap,
} from "@/lib/rbac";

describe("rbac utilities", () => {
  it("normalizes known and custom roles", () => {
    expect(normalizeAppRole(" admin ")).toBe("ADMIN");
    expect(normalizeAppRole("coordinator")).toBe("COORDINATOR");
    expect(normalizeAppRole("guest")).toBe("GUEST");
    expect(normalizeAppRole(null)).toBe("");
    expect(normalizeAppRole(undefined)).toBe("");
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

  it("returns undefined for unmatched paths", () => {
    const access = getRouteAccessForPath("/nonexistent");
    expect(access).toBeUndefined();
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

  it("returns default config when parsing null/undefined/empty config", () => {
    expect(parseRoleAccessConfig(null)["/dashboard/members"]).toBeDefined();
    expect(parseRoleAccessConfig(undefined)["/dashboard/members"]).toBeDefined();
    expect(parseRoleAccessConfig("")["/dashboard/members"]).toBeDefined();
  });

  it("returns default config when parsing invalid JSON", () => {
    const config = parseRoleAccessConfig("not-json");
    expect(config["/dashboard/members"]).toBeDefined();
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
    expect(getDefaultDashboardPath(null)).toBe("/dashboard");
  });

  it("converts config to view-only map", () => {
    const config = {
      "/dashboard/members": { view: ["ADMIN", "STAFF"], edit: ["ADMIN"] },
      "/dashboard/families": { view: ["COORDINATOR"], edit: [] },
    };
    expect(configToViewMap(config)).toEqual({
      "/dashboard/members": ["ADMIN", "STAFF"],
      "/dashboard/families": ["COORDINATOR"],
    });
  });

  it("serializes and deserializes role access config", () => {
    const config = {
      "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN", "STAFF"] },
    };
    const serialized = serializeRoleAccessConfig(config);
    const parsed = JSON.parse(serialized);
    expect(parsed["/dashboard/members"]).toEqual({
      view: ["ADMIN"],
      edit: ["ADMIN", "STAFF"],
    });
  });

  it("parses role access map from string", () => {
    const config = JSON.stringify({
      "/dashboard/members": ["ADMIN", "STAFF"],
    });
    const map = parseRoleAccessMap(config);
    expect(map["/dashboard/members"]).toEqual(["ADMIN", "STAFF"]);
  });

  it("serializes role access map", () => {
    const map = {
      "/dashboard/members": ["ADMIN", "STAFF"],
    };
    const serialized = serializeRoleAccessMap(map);
    const parsed = JSON.parse(serialized);
    expect(parsed["/dashboard/members"]).toEqual({
      view: ["ADMIN", "STAFF"],
      edit: ["ADMIN", "STAFF"],
    });
  });

  it("checks hasRequiredRole", () => {
    expect(hasRequiredRole("ADMIN", ["ADMIN", "STAFF"])).toBe(true);
    expect(hasRequiredRole("MEMBER", ["ADMIN", "STAFF"])).toBe(false);
    expect(hasRequiredRole("ADMIN", undefined)).toBe(true);
    expect(hasRequiredRole("ADMIN", [])).toBe(true);
    expect(hasRequiredRole(null, ["ADMIN"])).toBe(false);
  });

  it("gets allowed roles for path from config", () => {
    const config = {
      "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] },
    };
    expect(getAllowedRolesForPathFromConfig("/dashboard/members", config)).toEqual([
      "ADMIN",
    ]);
  });

  it("gets allowed roles for path from default config", () => {
    const roles = getAllowedRolesForPath("/dashboard/members");
    expect(roles).toContain("ADMIN");
    expect(roles).toContain("MEMBER");
  });

  it("gets edit roles for path", () => {
    const editRoles = getEditRolesForPath("/dashboard/members");
    expect(editRoles).toContain("ADMIN");
    expect(editRoles).not.toContain("MEMBER");
  });

  it("gets all protected route items with resolved config", () => {
    const items = getProtectedRouteItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty("path");
    expect(items[0]).toHaveProperty("roles");
    expect(items[0]).toHaveProperty("editRoles");
  });

  it("resolves role access config with overrides", () => {
    const config = resolveRoleAccessConfig({
      "/dashboard/members": {
        view: ["ADMIN", "STAFF", "COORDINATOR", "MEMBER", "GUEST"],
        edit: ["ADMIN", "STAFF"],
      },
    });
    expect(config["/dashboard/members"].view).toContain("GUEST");
  });
});
