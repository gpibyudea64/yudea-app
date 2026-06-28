import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAuthSession,
  getStoredUser,
  persistAuthSession,
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
      const windowSpy = vi.spyOn(globalThis as any, "window", "get");
      windowSpy.mockReturnValue(undefined as any);
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

    it("returns null when stored JSON is invalid", () => {
      localStorageMock.setItem(STORAGE_KEY_USER, "not-json");
      expect(getStoredUser()).toBeNull();
    });

    it("returns null when localStorage is accessed during SSR", () => {
      const windowSpy = vi.spyOn(globalThis as any, "window", "get");
      windowSpy.mockReturnValue(undefined as any);
      vi.clearAllMocks();

      expect(getStoredUser()).toBeNull();

      windowSpy.mockRestore();
    });
  });
});
