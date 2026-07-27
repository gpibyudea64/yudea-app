import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the auth module from @/auth before any imports
// Use vi.hoisted to create the mock before the hoisted vi.mock call runs
const mockAuth = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

import { getSessionUser, requireAdmin, requireAuth } from "@/lib/server-auth";
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
});
