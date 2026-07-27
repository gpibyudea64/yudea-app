import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  clearAuthSession,
  getStoredUser,
  persistAuthSession,
  useStoredUser,
} from "@/lib/auth-session";

const STORAGE_KEY_USER = "auth_user";
const STORAGE_KEY_TOKEN = "access_token";

// Mock localStorage since vitest jsdom may not support it
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
  get length() {
    return Object.keys(mockStorage).length;
  },
  key: vi.fn((index: number) => Object.keys(mockStorage)[index] ?? null),
};

beforeEach(() => {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  vi.stubGlobal("localStorage", localStorageMock);
  // Reset call counts for spies
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("auth-session", () => {
  describe("persistAuthSession", () => {
    it("stores token and user in localStorage", () => {
      persistAuthSession({
        token: "test-token",
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
          role: "ADMIN",
          regionId: "region-1",
        },
      });

      expect(localStorageMock.getItem(STORAGE_KEY_TOKEN)).toBe("test-token");
      expect(localStorageMock.getItem(STORAGE_KEY_USER)).toBe(
        JSON.stringify({
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
          role: "ADMIN",
          regionId: "region-1",
        }),
      );
    });

    it("dispatches a custom event when session is persisted", () => {
      const dispatchEvent = vi.spyOn(window, "dispatchEvent");

      persistAuthSession({
        token: "token",
        user: { role: "STAFF" },
      });

      expect(dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "auth-session-updated",
        }),
      );
    });

    it("does nothing when window is undefined", () => {
      const windowSpy = vi.spyOn(globalThis as unknown as Window & typeof globalThis, "window", "get");
      windowSpy.mockReturnValue(undefined as unknown as Window & typeof globalThis);
      vi.clearAllMocks();

      expect(() => {
        persistAuthSession({
          token: "token",
          user: { role: "ADMIN" },
        });
      }).not.toThrow();

      windowSpy.mockRestore();
    });
  });

  describe("clearAuthSession", () => {
    it("removes token and user from localStorage", () => {
      localStorageMock.setItem(STORAGE_KEY_TOKEN, "some-token");
      localStorageMock.setItem(
        STORAGE_KEY_USER,
        JSON.stringify({ role: "ADMIN" }),
      );

      clearAuthSession();

      expect(localStorageMock.getItem(STORAGE_KEY_TOKEN)).toBeNull();
      expect(localStorageMock.getItem(STORAGE_KEY_USER)).toBeNull();
    });

    it("dispatches a custom event when session is cleared", () => {
      const dispatchEvent = vi.spyOn(window, "dispatchEvent");

      clearAuthSession();

      expect(dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "auth-session-updated",
        }),
      );
    });
  });

  describe("getStoredUser", () => {
    it("returns null when no user is stored", () => {
      expect(getStoredUser()).toBeNull();
    });

    it("returns parsed user from localStorage", () => {
      const user = {
        id: "1",
        name: "John",
        role: "ADMIN",
        email: "john@test.com",
      };
      localStorageMock.setItem(STORAGE_KEY_USER, JSON.stringify(user));

      expect(getStoredUser()).toEqual(user);
    });

    it("returns cached user on repeated calls with same data", () => {
      const user = {
        id: "1",
        name: "Jane",
        role: "STAFF",
      };
      localStorageMock.setItem(STORAGE_KEY_USER, JSON.stringify(user));

      const first = getStoredUser();
      expect(first).toEqual(user);

      // Second call should return cached reference
      const second = getStoredUser();
      expect(second).toBe(first);
    });

    it("re-parses when localStorage value changes between calls", () => {
      const userA = { id: "1", name: "Alice", role: "ADMIN" };
      const userB = { id: "2", name: "Bob", role: "STAFF" };

      localStorageMock.setItem(STORAGE_KEY_USER, JSON.stringify(userA));
      getStoredUser(); // populate cache

      localStorageMock.setItem(STORAGE_KEY_USER, JSON.stringify(userB));

      const result = getStoredUser();
      expect(result).toEqual(userB);
    });

    it("returns null when stored JSON is invalid", () => {
      localStorageMock.setItem(STORAGE_KEY_USER, "not-json");
      expect(getStoredUser()).toBeNull();
    });

    it("returns null when localStorage is accessed during SSR", () => {
      const windowSpy = vi.spyOn(globalThis as unknown as Window & typeof globalThis, "window", "get");
      windowSpy.mockReturnValue(undefined as unknown as Window & typeof globalThis);
      vi.clearAllMocks();

      expect(getStoredUser()).toBeNull();

      windowSpy.mockRestore();
    });

    it("handles null stored value after previous valid value", () => {
      const user = { id: "1", name: "Test", role: "ADMIN" };
      localStorageMock.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      getStoredUser(); // populate cache

      localStorageMock.removeItem(STORAGE_KEY_USER);

      expect(getStoredUser()).toBeNull();
    });
  });

  describe("persistAuthSession - edge cases", () => {
    it("persists user without optional fields (email, name, regionId)", () => {
      persistAuthSession({
        user: { id: "1", role: "MEMBER" },
      });

      const stored = localStorageMock.getItem(STORAGE_KEY_USER);
      expect(stored).toBe(JSON.stringify({ id: "1", role: "MEMBER" }));
    });

    it("persists token only without user", () => {
      persistAuthSession({ token: "just-token" });

      expect(localStorageMock.getItem(STORAGE_KEY_TOKEN)).toBe("just-token");
      expect(localStorageMock.getItem(STORAGE_KEY_USER)).toBeNull();
    });

    it("handles persist with empty payload", () => {
      expect(() => persistAuthSession({})).not.toThrow();
    });
  });

  describe("clearAuthSession - edge cases", () => {
    it("does not throw when localStorage is empty", () => {
      expect(() => clearAuthSession()).not.toThrow();
    });

    it("skips localStorage operations when window is undefined (SSR)", () => {
      const removeItemSpy = vi.spyOn(localStorageMock, "removeItem");
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      const windowSpy = vi.spyOn(globalThis as unknown as Window & typeof globalThis, "window", "get");
      windowSpy.mockReturnValue(undefined as unknown as Window & typeof globalThis);

      expect(() => clearAuthSession()).not.toThrow();

      expect(removeItemSpy).not.toHaveBeenCalled();
      expect(dispatchSpy).not.toHaveBeenCalled();

      windowSpy.mockRestore();
    });
  });

  describe("setCookie / clearCookie (via document.cookie)", () => {
    it("sets cookies when persisting user with full fields", () => {
      // Clear initial document.cookie
      document.cookie = "access_token=; max-age=0";

      persistAuthSession({
        token: "tok-123",
        user: {
          id: "1",
          email: "user@test.com",
          name: "Test User",
          role: "ADMIN",
          regionId: "reg-1",
        },
      });

      expect(document.cookie).toContain("access_token=tok-123");
      expect(document.cookie).toContain("user_role=ADMIN");
      expect(document.cookie).toContain("user_email=user%40test.com");
      expect(document.cookie).toContain("user_name=Test%20User");
      expect(document.cookie).toContain("user_region_id=reg-1");
    });

    it("clears optional cookies when user is persisted without optional fields", () => {
      // Set up cookies that should be cleared
      document.cookie = "user_email=old@test.com; path=/";
      document.cookie = "user_name=OldName; path=/";
      document.cookie = "user_region_id=old-reg; path=/";

      persistAuthSession({
        user: { id: "1", role: "MEMBER" },
      });

      // User without email/name/regionId should clear those cookies
      // The cleared cookies have max-age=0, so they should be removed from document.cookie
      expect(document.cookie).not.toContain("user_email=");
      expect(document.cookie).not.toContain("user_name=");
      expect(document.cookie).not.toContain("user_region_id=");
    });

    it("clears auth cookies when clearing session", () => {
      // Set up cookies that should be cleared
      persistAuthSession({
        token: "tok-clear",
        user: { id: "1", role: "ADMIN", email: "a@b.com", name: "Admin" },
      });

      clearAuthSession();

      expect(document.cookie).not.toContain("access_token=");
      expect(document.cookie).not.toContain("user_role=");
      expect(document.cookie).not.toContain("user_email=");
      expect(document.cookie).not.toContain("user_name=");
    });

    it("setCookie early-returns when document is undefined (SSR)", () => {
      const documentSpy = vi.spyOn(globalThis as unknown as Window & typeof globalThis, "document", "get");
      documentSpy.mockReturnValue(undefined as unknown as Document);

      expect(() => {
        persistAuthSession({
          token: "ssr-token",
          user: { id: "1", role: "SSR_USER" },
        });
      }).not.toThrow();

      documentSpy.mockRestore();
    });

    it("clearCookie early-returns when document is undefined (SSR)", () => {
      const documentSpy = vi.spyOn(globalThis as unknown as Window & typeof globalThis, "document", "get");
      documentSpy.mockReturnValue(undefined as unknown as Document);

      expect(() => {
        clearAuthSession();
      }).not.toThrow();

      documentSpy.mockRestore();
    });
  });

  describe("useStoredUser (via renderHook / useSyncExternalStore)", () => {
    it("returns null when no user is stored", () => {
      const { result } = renderHook(() => useStoredUser());
      expect(result.current).toBeNull();
    });

    it("returns stored user on mount", () => {
      const user = { id: "1", name: "Hook User", role: "STAFF" };
      localStorageMock.setItem(STORAGE_KEY_USER, JSON.stringify(user));

      const { result } = renderHook(() => useStoredUser());
      expect(result.current).toEqual(user);
    });

    it("subscribes to events on mount", () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      const { unmount } = renderHook(() => useStoredUser());

      expect(addSpy).toHaveBeenCalledWith(
        "auth-session-updated",
        expect.any(Function),
      );
      expect(addSpy).toHaveBeenCalledWith(
        "storage",
        expect.any(Function),
      );

      unmount();
    });

    it("unsubscribes from events on unmount", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useStoredUser());
      unmount();

      expect(removeSpy).toHaveBeenCalledWith(
        "auth-session-updated",
        expect.any(Function),
      );
      expect(removeSpy).toHaveBeenCalledWith(
        "storage",
        expect.any(Function),
      );
    });

    it("updates when auth session event is dispatched", async () => {
      const { result } = renderHook(() => useStoredUser());
      expect(result.current).toBeNull();

      const user = { id: "1", name: "Event User", role: "ADMIN" };
      localStorageMock.setItem(STORAGE_KEY_USER, JSON.stringify(user));

      act(() => {
        window.dispatchEvent(new CustomEvent("auth-session-updated"));
      });

      await waitFor(() => {
        expect(result.current).toEqual(user);
      });
    });
  });
});
