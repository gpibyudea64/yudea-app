import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getStoredRoleAccessConfig,
  getStoredRoleAccessMap,
  persistRoleAccessConfig,
  resetStoredRoleAccessConfig,
} from "@/lib/rbac-config";

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
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("rbac-config", () => {
  describe("getStoredRoleAccessConfig", () => {
    it("returns default config when nothing is stored", () => {
      const config = getStoredRoleAccessConfig();
      expect(config["/dashboard/members"]).toBeDefined();
      expect(config["/dashboard/members"].view).toContain("ADMIN");
    });

    it("returns stored config from localStorage", () => {
      const customConfig = {
        "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] },
      };
      localStorageMock.setItem(
        "role_access_config",
        JSON.stringify(customConfig),
      );

      const config = getStoredRoleAccessConfig();
      expect(config["/dashboard/members"].view).toEqual(["ADMIN"]);
    });

    it("returns default config when window is undefined (SSR)", () => {
      const windowSpy = vi.spyOn(globalThis as unknown as Window & typeof globalThis, "window", "get");
      windowSpy.mockReturnValue(undefined as unknown as Window & typeof globalThis);
      vi.clearAllMocks();

      const config = getStoredRoleAccessConfig();
      expect(config["/dashboard/members"]).toBeDefined();

      windowSpy.mockRestore();
    });
  });

  describe("getStoredRoleAccessMap", () => {
    it("returns default view map when nothing is stored", () => {
      const map = getStoredRoleAccessMap();
      expect(map["/dashboard/members"]).toContain("ADMIN");
    });
  });

  describe("persistRoleAccessConfig", () => {
    it("stores config in localStorage", () => {
      const config = {
        "/dashboard/members": { view: ["ADMIN", "STAFF"], edit: ["ADMIN"] },
      };

      persistRoleAccessConfig(config);

      const stored = localStorageMock.getItem("role_access_config");
      expect(stored).toBeDefined();
      expect(stored).toContain("ADMIN");
      expect(stored).toContain("STAFF");
    });

    it("dispatches a custom event", () => {
      const dispatchEvent = vi.spyOn(window, "dispatchEvent");

      persistRoleAccessConfig({
        "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] },
      });

      expect(dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "role-access-config-updated",
        }),
      );
    });

    it("does nothing when window is undefined", () => {
      const windowSpy = vi.spyOn(globalThis as unknown as Window & typeof globalThis, "window", "get");
      windowSpy.mockReturnValue(undefined as unknown as Window & typeof globalThis);
      vi.clearAllMocks();

      expect(() => {
        persistRoleAccessConfig({
          "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] },
        });
      }).not.toThrow();

      windowSpy.mockRestore();
    });
  });

  describe("resetStoredRoleAccessConfig", () => {
    it("resets to default config", () => {
      persistRoleAccessConfig({
        "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] },
      });

      resetStoredRoleAccessConfig();

      const config = getStoredRoleAccessConfig();
      expect(config["/dashboard/members"].view).toContain("STAFF");
      expect(config["/dashboard/members"].view).toContain("MEMBER");
    });
  });
});
