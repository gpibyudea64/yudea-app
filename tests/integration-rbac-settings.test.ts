import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Prisma before imports
vi.mock("@/lib/prisma", () => ({
  prisma: {
    appSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getRoleAccessConfigFromDb,
  saveRoleAccessConfigToDb,
} from "@/lib/rbac-settings";

// Minimal type for what the test needs from a Prisma AppSetting result
type PrismaAppSettingValue = {
  key?: string;
  value?: string;
  id?: string;
  updatedAt?: Date;
};

const mockFindUnique = vi.mocked(prisma.appSetting.findUnique);
const mockUpsert = vi.mocked(prisma.appSetting.upsert);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rbac-settings integration", () => {
  describe("getRoleAccessConfigFromDb", () => {
    it("returns default config when no setting exists in DB", async () => {
      mockFindUnique.mockResolvedValue(null);

      const config = await getRoleAccessConfigFromDb();
      expect(config["/dashboard/members"]).toBeDefined();
      expect(config["/dashboard/members"].view).toContain("ADMIN");
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { key: "role_access_config" },
      });
    });

    it("returns parsed config when setting exists", async () => {
      mockFindUnique.mockResolvedValue({
        key: "role_access_config",
        value: JSON.stringify({
          "/dashboard/members": { view: ["ADMIN", "STAFF"], edit: ["ADMIN"] },
        }),
      } as PrismaAppSettingValue);

      const config = await getRoleAccessConfigFromDb();
      expect(config["/dashboard/members"].view).toEqual(["ADMIN", "STAFF"]);
    });

    it("handles legacy array-only config format", async () => {
      mockFindUnique.mockResolvedValue({
        key: "role_access_config",
        value: JSON.stringify({
          "/dashboard/members": ["ADMIN"],
        }),
      } as PrismaAppSettingValue);

      const config = await getRoleAccessConfigFromDb();
      expect(config["/dashboard/members"].view).toEqual(["ADMIN"]);
      expect(config["/dashboard/members"].edit).toEqual([]);
    });
  });

  describe("saveRoleAccessConfigToDb", () => {
    it("normalizes and saves config to DB", async () => {
      mockUpsert.mockResolvedValue({} as PrismaAppSettingValue);

      const result = await saveRoleAccessConfigToDb(
        JSON.stringify({
          "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] },
        }),
      );

      expect(result["/dashboard/members"].view).toContain("ADMIN");
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { key: "role_access_config" },
        create: {
          key: "role_access_config",
          value: expect.stringContaining("ADMIN"),
        },
        update: {
          value: expect.stringContaining("ADMIN"),
        },
      });
    });

    it("protects admin-only routes like /dashboard/settings", async () => {
      mockUpsert.mockResolvedValue({} as PrismaAppSettingValue);

      const result = await saveRoleAccessConfigToDb(
        JSON.stringify({
          "/dashboard/settings": { view: ["STAFF"], edit: ["STAFF"] },
        }),
      );

      expect(result["/dashboard/settings"].view).toEqual(["ADMIN"]);
      expect(result["/dashboard/settings"].edit).toEqual(["ADMIN"]);
    });

    it("throws when Prisma upsert fails", async () => {
      mockUpsert.mockRejectedValue(new Error("DB connection lost"));

      await expect(
        saveRoleAccessConfigToDb(JSON.stringify({})),
      ).rejects.toThrow("DB connection lost");
    });
  });
});
