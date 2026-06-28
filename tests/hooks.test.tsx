import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Mock all API modules
vi.mock("@/lib/api/member", () => ({
  getMembers: vi.fn(),
  getMember: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  getPresbyters: vi.fn(),
}));

vi.mock("@/lib/api/family", () => ({
  getFamilies: vi.fn(),
  getFamily: vi.fn(),
  createFamily: vi.fn(),
  updateFamily: vi.fn(),
  deleteFamily: vi.fn(),
}));

vi.mock("@/lib/api/branch", () => ({
  getBranches: vi.fn(),
  getBranch: vi.fn(),
  createBranch: vi.fn(),
  updateBranch: vi.fn(),
  deleteBranch: vi.fn(),
}));

vi.mock("@/lib/api/region", () => ({
  getRegions: vi.fn(),
  getRegion: vi.fn(),
  createRegion: vi.fn(),
  updateRegion: vi.fn(),
  deleteRegion: vi.fn(),
  getRegionMemberCounts: vi.fn(),
}));

vi.mock("@/lib/api/user", () => ({
  getUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("@/lib/api/attendance", () => ({
  getAttendances: vi.fn(),
  getAttendance: vi.fn(),
  createAttendance: vi.fn(),
  updateAttendance: vi.fn(),
  deleteAttendance: vi.fn(),
}));

vi.mock("@/lib/api/birthday", () => ({
  getBirthdayMembers: vi.fn(),
}));

vi.mock("@/lib/api/rbac-settings", () => ({
  fetchRoleAccessConfig: vi.fn(),
  saveRoleAccessConfig: vi.fn(),
}));

import * as memberApi from "@/lib/api/member";
import * as familyApi from "@/lib/api/family";
import * as branchApi from "@/lib/api/branch";
import * as regionApi from "@/lib/api/region";
import * as userApi from "@/lib/api/user";
import * as attendanceApi from "@/lib/api/attendance";
import * as birthdayApi from "@/lib/api/birthday";
import * as rbacApi from "@/lib/api/rbac-settings";

import {
  useMembers,
  useMember,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  usePresbyters,
  useMembersGenderCount,
  useMembersBloodTypeCount,
  useAllPelkatCounts,
} from "@/hooks/use-member";
import {
  useFamilies,
  useFamily,
  useCreateFamily,
  useUpdateFamily,
  useDeleteFamily,
} from "@/hooks/use-family";
import {
  useBranches,
  useBranch,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "@/hooks/use-branch";
import {
  useRegions,
  useRegion,
  useCreateRegion,
  useUpdateRegion,
  useDeleteRegion,
  useMemberPerRegions,
} from "@/hooks/use-region";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/use-user";
import {
  useAttendances,
  useAttendance,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from "@/hooks/use-attendance";
import { useBirthdayMembers } from "@/hooks/use-birthday";
import {
  useRoleAccessSettings,
  useSaveRoleAccessSettings,
} from "@/hooks/use-rbac-settings";

// Shared helpers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

const mockMembers = { data: [{ id: "1", firstName: "John" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
const mockFamilies = { data: [{ id: "1", familyName: "Smith" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
const mockBranches = { data: [{ id: "1", name: "Main" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
const mockRegions = { data: [{ id: "1", name: "Region A" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
const mockUsers = { data: [{ id: "1", name: "Admin", email: "a@b.com", role: "ADMIN" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
const mockAttendances = { data: [{ id: "1", serviceDate: "2026-06-01", serviceType: "Sunday", maleCount: 10, femaleCount: 15, totalCount: 25 }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
const mockBirthday = { data: [{ id: "1", firstName: "John", lastName: null, fullName: "John", birthDate: "2026-06-02", regionName: "A", familyName: "Smith", address: "Addr", pelkat: null }], meta: { start: "2026-06-01", end: "2026-06-07" } };
const mockRegionMemberCounts = { data: [{ regionId: "1", regionName: "A", memberCount: 10 }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMembers", () => {
  it("fetches members with correct params", async () => {
    vi.mocked(memberApi.getMembers).mockResolvedValue(mockMembers as any);
    const { result } = renderHook(
      () => useMembers({ page: 1, limit: 10, search: "", region: "all", pelkat: "all" }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMembers);
    expect(memberApi.getMembers).toHaveBeenCalledWith(1, 10, "", "all", "all", "firstName", "asc");
  });

  it("handles error state", async () => {
    vi.mocked(memberApi.getMembers).mockRejectedValue(new Error("API error"));
    const { result } = renderHook(
      () => useMembers({ page: 1, limit: 10 }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useMember", () => {
  it("fetches single member by id", async () => {
    vi.mocked(memberApi.getMember).mockResolvedValue({ id: "1", firstName: "John" } as any);
    const { result } = renderHook(() => useMember("1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.firstName).toBe("John");
  });

  it("is disabled when id is empty", async () => {
    const { result } = renderHook(() => useMember(""), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(true);
  });
});

describe("usePresbyters", () => {
  it("fetches presbyters", async () => {
    vi.mocked(memberApi.getPresbyters).mockResolvedValue(mockMembers as any);
    const { result } = renderHook(
      () => usePresbyters({ page: 1, limit: 10, search: "", region: "all" }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(memberApi.getPresbyters).toHaveBeenCalledWith(1, 10, "", "all");
  });
});

describe("useMembersGenderCount", () => {
  it("fetches gender counts", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ all: 100, female: 55, male: 45 }),
    } as Response);
    const { result } = renderHook(() => useMembersGenderCount(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.all).toBe(100);
  });
});

describe("useMembersBloodTypeCount", () => {
  it("fetches blood type counts", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ A: 30, B: 25, AB: 10, O: 35 }),
    } as Response);
    const { result } = renderHook(() => useMembersBloodTypeCount(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.A).toBe(30);
  });
});

describe("useAllPelkatCounts", () => {
  it("fetches pelkat counts", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ pelkat: "PELAYANAN_ANAK", total: 20 }]),
    } as Response);
    const { result } = renderHook(() => useAllPelkatCounts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].total).toBe(20);
  });
});

describe("useCreateMember mutation", () => {
  it("calls createMember on mutation and invalidates queries", async () => {
    vi.mocked(memberApi.createMember).mockResolvedValue({ id: "new" } as any);
    const { result } = renderHook(() => useCreateMember(), { wrapper: createWrapper() });
    result.current.mutate({ firstName: "New" } as any);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(memberApi.createMember).toHaveBeenCalled();
  });
});

describe("useUpdateMember mutation", () => {
  it("calls updateMember on mutation", async () => {
    vi.mocked(memberApi.updateMember).mockResolvedValue({ id: "1" } as any);
    const { result } = renderHook(() => useUpdateMember(), { wrapper: createWrapper() });
    result.current.mutate({ id: "1", data: { firstName: "Updated" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(memberApi.updateMember).toHaveBeenCalledWith("1", { firstName: "Updated" });
  });
});

describe("useDeleteMember mutation", () => {
  it("calls deleteMember on mutation", async () => {
    vi.mocked(memberApi.deleteMember).mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteMember(), { wrapper: createWrapper() });
    result.current.mutate("1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(memberApi.deleteMember).toHaveBeenCalledWith("1");
  });
});

// ── Family hooks ──

describe("useFamilies", () => {
  it("fetches families with sort params", async () => {
    vi.mocked(familyApi.getFamilies).mockResolvedValue(mockFamilies as any);
    const { result } = renderHook(() => useFamilies(1, 10, "", "familyName", "asc"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockFamilies);
  });
});

describe("useFamily", () => {
  it("is disabled when id is empty", async () => {
    const { result } = renderHook(() => useFamily(""), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(true);
  });
});

describe("useCreateFamily mutation", () => {
  it("calls createFamily", async () => {
    vi.mocked(familyApi.createFamily).mockResolvedValue({ id: "new", familyName: "New" } as any);
    const { result } = renderHook(() => useCreateFamily(), { wrapper: createWrapper() });
    result.current.mutate({ familyName: "New", regionId: "r1", members: [] } as any);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(familyApi.createFamily).toHaveBeenCalled();
  });
});

// ── Branch hooks ──

describe("useBranches", () => {
  it("fetches branches", async () => {
    vi.mocked(branchApi.getBranches).mockResolvedValue(mockBranches as any);
    const { result } = renderHook(() => useBranches(1, 10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockBranches);
  });
});

describe("useBranch", () => {
  it("fetches single branch", async () => {
    vi.mocked(branchApi.getBranch).mockResolvedValue({ id: "1", name: "Main" } as any);
    const { result } = renderHook(() => useBranch("1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe("Main");
  });
});

describe("useCreateBranch mutation", () => {
  it("calls createBranch", async () => {
    vi.mocked(branchApi.createBranch).mockResolvedValue({ id: "new", name: "New" } as any);
    const { result } = renderHook(() => useCreateBranch(), { wrapper: createWrapper() });
    result.current.mutate({ name: "New" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useDeleteBranch mutation", () => {
  it("calls deleteBranch", async () => {
    vi.mocked(branchApi.deleteBranch).mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteBranch(), { wrapper: createWrapper() });
    result.current.mutate("1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(branchApi.deleteBranch).toHaveBeenCalledWith("1");
  });
});

// ── Region hooks ──

describe("useRegions", () => {
  it("fetches regions", async () => {
    vi.mocked(regionApi.getRegions).mockResolvedValue(mockRegions as any);
    const { result } = renderHook(() => useRegions(1, 10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRegions);
  });
});

describe("useMemberPerRegions", () => {
  it("fetches region member counts", async () => {
    vi.mocked(regionApi.getRegionMemberCounts).mockResolvedValue(mockRegionMemberCounts as any);
    const { result } = renderHook(() => useMemberPerRegions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRegionMemberCounts);
  });
});

describe("useCreateRegion mutation", () => {
  it("calls createRegion", async () => {
    vi.mocked(regionApi.createRegion).mockResolvedValue({ id: "new", name: "New", branchId: "b1" } as any);
    const { result } = renderHook(() => useCreateRegion(), { wrapper: createWrapper() });
    result.current.mutate({ name: "New", branchId: "b1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ── User hooks ──

describe("useUsers", () => {
  it("fetches users", async () => {
    vi.mocked(userApi.getUsers).mockResolvedValue(mockUsers as any);
    const { result } = renderHook(() => useUsers(1, 10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUsers);
  });
});

describe("useCreateUser mutation", () => {
  it("calls createUser", async () => {
    vi.mocked(userApi.createUser).mockResolvedValue({ id: "new", name: "U", email: "u@b.com", role: "STAFF" } as any);
    const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });
    result.current.mutate({ name: "U", email: "u@b.com", password: "123456", role: "STAFF" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ── Attendance hooks ──

describe("useAttendances", () => {
  it("fetches attendances", async () => {
    vi.mocked(attendanceApi.getAttendances).mockResolvedValue(mockAttendances as any);
    const { result } = renderHook(() => useAttendances(1, 10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockAttendances);
  });
});

describe("useCreateAttendance mutation", () => {
  it("calls createAttendance", async () => {
    vi.mocked(attendanceApi.createAttendance).mockResolvedValue({ id: "new", serviceDate: "2026-06-01", serviceType: "Sunday", maleCount: 10, femaleCount: 15, totalCount: 25 } as any);
    const { result } = renderHook(() => useCreateAttendance(), { wrapper: createWrapper() });
    result.current.mutate({ serviceDate: "2026-06-01", serviceType: "Sunday", maleCount: 10, femaleCount: 15 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ── Birthday hooks ──

describe("useBirthdayMembers", () => {
  it("fetches birthday members", async () => {
    vi.mocked(birthdayApi.getBirthdayMembers).mockResolvedValue(mockBirthday as any);
    const { result } = renderHook(() => useBirthdayMembers("2026-06-03"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockBirthday);
  });
});

// ── RBAC hooks ──

describe("useRoleAccessSettings", () => {
  it("fetches RBAC config", async () => {
    const config = { "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] } };
    vi.mocked(rbacApi.fetchRoleAccessConfig).mockResolvedValue(config);
    const { result } = renderHook(() => useRoleAccessSettings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(config);
  });
});

describe("useSaveRoleAccessSettings mutation", () => {
  it("calls saveRoleAccessConfig", async () => {
    const config = { "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] } };
    vi.mocked(rbacApi.saveRoleAccessConfig).mockResolvedValue(config);
    const { result } = renderHook(() => useSaveRoleAccessSettings(), { wrapper: createWrapper() });
    result.current.mutate(config);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rbacApi.saveRoleAccessConfig).toHaveBeenCalledWith(config);
  });
});
