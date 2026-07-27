import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  getStoredRoleAccessConfig,
  getStoredRoleAccessMap,
  persistRoleAccessConfig,
  resetStoredRoleAccessConfig,
  roleAccessConfigEvent,
  useStoredRoleAccessConfig,
  useStoredRoleAccessMap,
} from "@/lib/rbac-config";
import { parseRoleAccessConfig } from "@/lib/rbac";

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

    it("returns cached config on repeated calls with same value", () => {
      const customConfig = {
        "/dashboard/report": { view: ["ADMIN"], edit: ["ADMIN"] },
      };
      localStorageMock.setItem(
        "role_access_config",
        JSON.stringify(customConfig),
      );

      // First call populates the cache
      const first = getStoredRoleAccessConfig();
      expect(first["/dashboard/report"]).toBeDefined();

      // Track the reference
      const second = getStoredRoleAccessConfig();
      expect(second).toBe(first);
    });

    it("re-parses when localStorage value changes", () => {
      const configA = {
        "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] },
      };
      localStorageMock.setItem(
        "role_access_config",
        JSON.stringify(configA),
      );

      // First call caches configA
      const first = getStoredRoleAccessConfig();
      expect(first["/dashboard/members"].view).toEqual(["ADMIN"]);

      // Change the stored value
      const configB = {
        "/dashboard/members": { view: ["STAFF"], edit: ["STAFF"] },
      };
      localStorageMock.setItem(
        "role_access_config",
        JSON.stringify(configB),
      );

      // Second call should detect the change and re-parse
      const second = getStoredRoleAccessConfig();
      expect(second["/dashboard/members"].view).toEqual(["STAFF"]);
    });

    it("handles null stored value by re-parsing to default", () => {
      // Store then clear to break cache
      const config = {
        "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] },
      };
      localStorageMock.setItem(
        "role_access_config",
        JSON.stringify(config),
      );
      getStoredRoleAccessConfig(); // populate cache

      localStorageMock.removeItem("role_access_config");

      const result = getStoredRoleAccessConfig();
      expect(result["/dashboard/members"].view).toContain("STAFF");
      expect(result["/dashboard/members"].view).toContain("MEMBER");
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

  describe("roleAccessConfigEvent", () => {
    it("exports the expected event name", () => {
      expect(roleAccessConfigEvent).toBe("role-access-config-updated");
    });
  });



  describe("event-driven synchronization", () => {
    it("getStoredRoleAccessConfig reflects changes after persist", () => {
      const original = getStoredRoleAccessConfig();
      expect(original["/dashboard/members"].view).toContain("STAFF");

      const newConfig = {
        "/dashboard/members": { view: ["ADMIN_ONLY"], edit: ["ADMIN"] },
      };
      persistRoleAccessConfig(newConfig);

      // After persist, getter should return the new config
      const updated = getStoredRoleAccessConfig();
      expect(updated["/dashboard/members"].view).toEqual(["ADMIN_ONLY"]);
    });
  });

  describe("edge cases - resetStoredRoleAccessConfig", () => {
    it("produces the same result as calling with default config directly", () => {
      persistRoleAccessConfig({
        "/dashboard/members": { view: ["CUSTOM"], edit: ["CUSTOM"] },
      });

      resetStoredRoleAccessConfig();

      const afterReset = getStoredRoleAccessConfig();
      const freshDefault = parseRoleAccessConfig(null);
      expect(afterReset).toEqual(freshDefault);
    });
  });

  describe("useStoredRoleAccessConfig (via renderHook / useSyncExternalStore)", () => {
    it("returns default config when nothing is stored", () => {
      const { result } = renderHook(() => useStoredRoleAccessConfig());
      expect(result.current["/dashboard/members"]).toBeDefined();
      expect(result.current["/dashboard/members"].view).toContain("ADMIN");
    });

    it("returns stored config from localStorage on mount", () => {
      const customConfig = {
        "/dashboard/members": { view: ["CUSTOM_ROLE"], edit: ["ADMIN"] },
      };
      localStorageMock.setItem(
        "role_access_config",
        JSON.stringify(customConfig),
      );

      const { result } = renderHook(() => useStoredRoleAccessConfig());
      expect(result.current["/dashboard/members"].view).toEqual(["CUSTOM_ROLE"]);
    });

    it("subscribes to custom event and storage event on mount", () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      const { unmount } = renderHook(() => useStoredRoleAccessConfig());

      expect(addSpy).toHaveBeenCalledWith(
        "role-access-config-updated",
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

      const { unmount } = renderHook(() => useStoredRoleAccessConfig());
      unmount();

      expect(removeSpy).toHaveBeenCalledWith(
        "role-access-config-updated",
        expect.any(Function),
      );
      expect(removeSpy).toHaveBeenCalledWith(
        "storage",
        expect.any(Function),
      );
    });

    it("updates when custom event is dispatched after localStorage change", async () => {
      const { result } = renderHook(() => useStoredRoleAccessConfig());

      const newConfig = {
        "/dashboard/members": { view: ["EVENT_UPDATED"], edit: ["ADMIN"] },
      };
      localStorageMock.setItem(
        "role_access_config",
        JSON.stringify(newConfig),
      );
      act(() => {
        window.dispatchEvent(new CustomEvent("role-access-config-updated"));
      });

      await waitFor(() => {
        expect(result.current["/dashboard/members"].view).toEqual(["EVENT_UPDATED"]);
      });
    });
  });

  describe("useStoredRoleAccessMap (via renderHook)", () => {
    it("returns view map from the stored config", () => {
      const { result } = renderHook(() => useStoredRoleAccessMap());
      expect(result.current["/dashboard/members"]).toContain("ADMIN");
    });

    it("reflects persisted config changes", async () => {
      const { result } = renderHook(() => useStoredRoleAccessMap());

      const newConfig = {
        "/dashboard/members": { view: ["CUSTOM_ROLE"], edit: ["ADMIN"] },
      };
      act(() => {
        persistRoleAccessConfig(newConfig);
      });

      await waitFor(() => {
        expect(result.current["/dashboard/members"]).toContain("CUSTOM_ROLE");
      });
    });
  });
});
