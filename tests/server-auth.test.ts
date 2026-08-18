import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the auth module from @/auth before any imports
// Use vi.hoisted to create the mock before the hoisted vi.mock call runs
const mockAuth = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

// Mock the DB-backed RBAC config loader so requireEditAccess runs against a
// known config without a database.
const mockGetRoleAccessConfigFromDb = vi.hoisted(() => vi.fn());
vi.mock("@/lib/rbac-settings", () => ({
  getRoleAccessConfigFromDb: mockGetRoleAccessConfigFromDb,
}));

import {
  getSessionUser,
  requireAdmin,
  requireAuth,
  requireEditAccess,
  requireViewAccess,
} from "@/lib/server-auth";
import { defaultRoleAccessConfig } from "@/lib/rbac";
import { NextResponse } from "next/server";

// Partial session type for test mocks (extends Session for type compatibility)
interface MockSession {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    regionId?: string;
  };
  expires?: string;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("server-auth", () => {
  describe("getSessionUser", () => {
    it("returns null when no session exists", async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getSessionUser();
      expect(result).toBeNull();
    });

    it("returns null when session has no user id", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "test@example.com" },
      } as MockSession);
      const result = await getSessionUser();
      expect(result).toBeNull();
    });

    it("returns normalized user from session", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@test.com",
          name: "Admin",
          role: "admin",
        },
      } as MockSession);

      const result = await getSessionUser();
      expect(result).toEqual({
        id: "user-1",
        email: "admin@test.com",
        name: "Admin",
        role: "ADMIN",
        regionId: undefined,
      });
    });

    it("handles missing optional fields", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "staff" },
      } as MockSession);

      const result = await getSessionUser();
      expect(result).toEqual({
        id: "user-1",
        email: undefined,
        name: undefined,
        role: "STAFF",
        regionId: undefined,
      });
    });

    it("includes the coordinator's regionId", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-3", role: "coordinator", regionId: "region-1" },
      } as MockSession);

      const result = await getSessionUser();
      expect(result).toEqual({
        id: "user-3",
        email: undefined,
        name: undefined,
        role: "COORDINATOR",
        regionId: "region-1",
      });
    });
  });

  describe("requireAuth", () => {
    it("returns user when authenticated", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "admin" },
      } as MockSession);

      const result = await requireAuth();
      expect(result.user).not.toBeNull();
      expect(result.error).toBeNull();
      expect(result.user!.role).toBe("ADMIN");
    });

    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await requireAuth();
      expect(result.user).toBeNull();
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error!.status).toBe(401);
    });
  });

  describe("requireAdmin", () => {
    it("returns user when role is ADMIN", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "admin" },
      } as MockSession);

      const result = await requireAdmin();
      expect(result.user).not.toBeNull();
      expect(result.error).toBeNull();
    });

    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await requireAdmin();
      expect(result.user).toBeNull();
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error!.status).toBe(401);
    });

    it("returns error when role is not ADMIN", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-2", role: "staff" },
      } as MockSession);

      const result = await requireAdmin();
      expect(result.user).toBeNull();
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error!.status).toBe(403);
    });
  });

  describe("requireEditAccess", () => {
    beforeEach(() => {
      mockGetRoleAccessConfigFromDb.mockResolvedValue(defaultRoleAccessConfig);
    });

    it("allows STAFF to edit members (in the edit list)", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "staff" },
      } as MockSession);

      const result = await requireEditAccess("/dashboard/members");
      expect(result.user).not.toBeNull();
      expect(result.error).toBeNull();
    });

    it("allows COORDINATOR to edit families (in the edit list)", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-2", role: "coordinator", regionId: "region-1" },
      } as MockSession);

      const result = await requireEditAccess("/dashboard/families");
      expect(result.error).toBeNull();
    });

    it("denies MEMBER writes on /dashboard/members (view-only role)", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-3", role: "member" },
      } as MockSession);

      const result = await requireEditAccess("/dashboard/members");
      expect(result.user).toBeNull();
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error!.status).toBe(403);
    });

    it("denies COORDINATOR writes on /dashboard/branches (not in edit list)", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-4", role: "coordinator", regionId: "region-1" },
      } as MockSession);

      const result = await requireEditAccess("/dashboard/branches");
      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(403);
    });

    it("denies everyone when the persisted edit list is empty (no fail-open)", async () => {
      // A legacy array-format config (or an admin clearing a route's edit
      // roles) stores `edit: []`. That must DENY writes, not open them to
      // every authenticated role.
      mockGetRoleAccessConfigFromDb.mockResolvedValue({
        "/dashboard/members": {
          view: ["ADMIN", "STAFF", "COORDINATOR", "MEMBER"],
          edit: [],
        },
      });
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "staff" },
      } as MockSession);

      const result = await requireEditAccess("/dashboard/members");
      expect(result.user).toBeNull();
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error!.status).toBe(403);
    });

    it("denies even an ADMIN when the persisted edit list is empty", async () => {
      mockGetRoleAccessConfigFromDb.mockResolvedValue({
        "/dashboard/families": { view: ["ADMIN"], edit: [] },
      });
      mockAuth.mockResolvedValue({
        user: { id: "user-5", role: "admin" },
      } as MockSession);

      const result = await requireEditAccess("/dashboard/families");
      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(403);
    });

    it("returns 401 when unauthenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await requireEditAccess("/dashboard/members");
      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(401);
    });
  });

  describe("requireViewAccess", () => {
    beforeEach(() => {
      mockGetRoleAccessConfigFromDb.mockResolvedValue(defaultRoleAccessConfig);
    });

    it("allows MEMBER to view /dashboard/members (in the view list)", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "member" },
      } as MockSession);

      const result = await requireViewAccess("/dashboard/members");
      expect(result.user).not.toBeNull();
      expect(result.error).toBeNull();
    });

    it("allows COORDINATOR to view /dashboard/families", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-2", role: "coordinator", regionId: "region-1" },
      } as MockSession);

      const result = await requireViewAccess("/dashboard/families");
      expect(result.error).toBeNull();
      expect(result.user!.regionId).toBe("region-1");
    });

    it("denies MEMBER reads on /dashboard/families (view list excludes MEMBER)", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-3", role: "member" },
      } as MockSession);

      const result = await requireViewAccess("/dashboard/families");
      expect(result.user).toBeNull();
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error!.status).toBe(403);
    });

    it("denies COORDINATOR reads on /dashboard/branches (not in view list)", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-4", role: "coordinator", regionId: "region-1" },
      } as MockSession);

      const result = await requireViewAccess("/dashboard/branches");
      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(403);
    });

    it("denies everyone when the persisted view list is empty (no fail-open)", async () => {
      mockGetRoleAccessConfigFromDb.mockResolvedValue({
        "/dashboard/members": { view: [], edit: ["ADMIN"] },
      });
      mockAuth.mockResolvedValue({
        user: { id: "user-5", role: "admin" },
      } as MockSession);

      const result = await requireViewAccess("/dashboard/members");
      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(403);
    });

    it("returns 401 when unauthenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await requireViewAccess("/dashboard/members");
      expect(result.user).toBeNull();
      expect(result.error!.status).toBe(401);
    });
  });
});
