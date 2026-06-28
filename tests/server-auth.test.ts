import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the auth module from @/auth before any imports
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/auth";
import { getSessionUser, requireAdmin, requireAuth } from "@/lib/server-auth";
import { NextResponse } from "next/server";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("server-auth", () => {
  describe("getSessionUser", () => {
    it("returns null when no session exists", async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const result = await getSessionUser();
      expect(result).toBeNull();
    });

    it("returns null when session has no user id", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: "test@example.com" },
      } as any);
      const result = await getSessionUser();
      expect(result).toBeNull();
    });

    it("returns normalized user from session", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@test.com",
          name: "Admin",
          role: "admin",
        },
      } as any);

      const result = await getSessionUser();
      expect(result).toEqual({
        id: "user-1",
        email: "admin@test.com",
        name: "Admin",
        role: "ADMIN",
      });
    });

    it("handles missing optional fields", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-1", role: "staff" },
      } as any);

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
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-1", role: "admin" },
      } as any);

      const result = await requireAuth();
      expect(result.user).not.toBeNull();
      expect(result.error).toBeNull();
      expect(result.user!.role).toBe("ADMIN");
    });

    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const result = await requireAuth();
      expect(result.user).toBeNull();
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error!.status).toBe(401);
    });
  });

  describe("requireAdmin", () => {
    it("returns user when role is ADMIN", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-1", role: "admin" },
      } as any);

      const result = await requireAdmin();
      expect(result.user).not.toBeNull();
      expect(result.error).toBeNull();
    });

    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const result = await requireAdmin();
      expect(result.user).toBeNull();
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error!.status).toBe(401);
    });

    it("returns error when role is not ADMIN", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-2", role: "staff" },
      } as any);

      const result = await requireAdmin();
      expect(result.user).toBeNull();
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error!.status).toBe(403);
    });
  });
});
