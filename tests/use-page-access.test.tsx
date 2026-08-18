import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/members",
}));

// Mock lib/auth-session
vi.mock("@/lib/auth-session", () => ({
  useStoredUser: vi.fn(),
}));

// Mock lib/rbac-config
vi.mock("@/lib/rbac-config", () => ({
  useStoredRoleAccessConfig: vi.fn(),
}));

// Mock lib/rbac
vi.mock("@/lib/rbac", () => ({
  canViewPath: vi.fn(),
  canEditPath: vi.fn(),
}));

import { useStoredUser } from "@/lib/auth-session";
import { useStoredRoleAccessConfig } from "@/lib/rbac-config";
import { canViewPath, canEditPath } from "@/lib/rbac";
import { usePageAccess } from "@/hooks/use-page-access";

describe("usePageAccess", () => {
  beforeEach(() => {
    vi.mocked(useStoredUser).mockReturnValue({ role: "ADMIN" });
    vi.mocked(useStoredRoleAccessConfig).mockReturnValue({});
    vi.mocked(canViewPath).mockReturnValue(true);
    vi.mocked(canEditPath).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns canView and canEdit as true for ADMIN role", () => {
    const { result } = renderHook(() => usePageAccess("/dashboard/members"));

    expect(result.current.canView).toBe(true);
    expect(result.current.canEdit).toBe(true);
    expect(result.current.role).toBe("ADMIN");
  });

  it("returns role from stored user", () => {
    vi.mocked(useStoredUser).mockReturnValue({ role: "STAFF" });
    vi.mocked(canViewPath).mockReturnValue(true);
    vi.mocked(canEditPath).mockReturnValue(false);

    const { result } = renderHook(() => usePageAccess("/dashboard/members"));

    expect(result.current.role).toBe("STAFF");
    expect(result.current.canView).toBe(true);
    expect(result.current.canEdit).toBe(false);
  });

  it("passes the correct pathname to canViewPath and canEditPath", () => {
    renderHook(() => usePageAccess("/dashboard/settings"));

    expect(canViewPath).toHaveBeenCalledWith(
      expect.anything(),
      "/dashboard/settings",
      expect.anything(),
    );
    expect(canEditPath).toHaveBeenCalledWith(
      expect.anything(),
      "/dashboard/settings",
      expect.anything(),
    );
  });

  it("uses current pathname when no pathname provided", () => {
    renderHook(() => usePageAccess());

    expect(canViewPath).toHaveBeenCalledWith(
      expect.anything(),
      "/dashboard/members",
      expect.anything(),
    );
  });

  it("passes the stored user role to authorization checks", () => {
    vi.mocked(useStoredUser).mockReturnValue({ role: "COORDINATOR" });

    renderHook(() => usePageAccess("/dashboard/families"));

    expect(canViewPath).toHaveBeenCalledWith(
      "COORDINATOR",
      expect.anything(),
      expect.anything(),
    );
  });

  it("handles undefined user (not logged in)", () => {
    vi.mocked(useStoredUser).mockReturnValue(null);

    const { result } = renderHook(() => usePageAccess("/dashboard/members"));

    expect(result.current.role).toBeUndefined();
  });

  it("memoizes the return value", () => {
    const { result, rerender } = renderHook(() =>
      usePageAccess("/dashboard/members"),
    );

    const firstResult = result.current;
    rerender();

    // Should be the same reference due to useMemo
    expect(result.current).toBe(firstResult);
  });
});
