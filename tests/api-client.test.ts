import { afterEach, describe, expect, it, vi } from "vitest";
import { getMembers, getMember, createMember, updateMember, deleteMember, getPresbyters } from "@/lib/api/member";
import { getFamilies, getFamily, createFamily, updateFamily, deleteFamily } from "@/lib/api/family";
import { getBranches, getBranch, createBranch, updateBranch, deleteBranch } from "@/lib/api/branch";
import { getRegions, getRegion, createRegion, updateRegion, deleteRegion, getRegionMemberCounts } from "@/lib/api/region";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/api/user";
import { getAttendances, getAttendance, createAttendance, updateAttendance, deleteAttendance } from "@/lib/api/attendance";
import { getBirthdayMembers } from "@/lib/api/birthday";
import { fetchRoleAccessConfig, saveRoleAccessConfig } from "@/lib/api/rbac-settings";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

afterEach(() => {
  vi.restoreAllMocks();
});

function mockResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  } as Response);
}

describe("API client - member", () => {
  it("getMembers fetches with correct params", async () => {
    const response = { data: [{ id: "1", firstName: "John" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getMembers(1, 10, "john", "region-1", "all", "firstName", "asc");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/member?page=1&limit=10&sortBy=firstName&sortOrder=asc&search=john&region=region-1"));
  });

  it("getPresbyters fetches presbyter endpoint", async () => {
    const response = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getPresbyters(1, 10, "", "all");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/member/presbyter"));
  });

  it("getMember fetches by id", async () => {
    const response = { id: "1", firstName: "John" };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getMember("1");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith("/api/member/1");
  });

  it("createMember sends POST with payload", async () => {
    const response = { id: "new", firstName: "John", lastName: "Doe" };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await createMember({ firstName: "John", lastName: "Doe" } as Parameters<typeof createMember>[0]);
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith("/api/member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "John", lastName: "Doe" }),
    });
  });

  it("updateMember sends PATCH with payload", async () => {
    const payload = { firstName: "Jane" };
    const response = { id: "1", ...payload };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await updateMember("1", payload);
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith("/api/member/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("deleteMember sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await deleteMember("1");
    expect(mockFetch).toHaveBeenCalledWith("/api/member/1", { method: "DELETE" });
  });

  it("throws on failed request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Not found" }, false));
    await expect(getMember("999")).rejects.toThrow("Failed to fetch member");
  });
});

describe("API client - family", () => {
  it("getFamilies fetches with sort params", async () => {
    const response = { data: [{ id: "1", familyName: "Smith" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getFamilies(1, 10, "", "familyName", "asc");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/family?page=1&limit=10&sortBy=familyName&sortOrder=asc"));
  });

  it("createFamily sends POST", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new", familyName: "Smith", regionId: "r1" }));
    const result = await createFamily({ familyName: "Smith", regionId: "r1" } as Parameters<typeof createFamily>[0]);
    expect(result.id).toBe("new");
    expect(mockFetch).toHaveBeenCalledWith("/api/family", expect.objectContaining({ method: "POST" }));
  });

  it("deleteFamily sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await deleteFamily("1");
    expect(mockFetch).toHaveBeenCalledWith("/api/family/1", { method: "DELETE" });
  });
});

describe("API client - branch", () => {
  it("getBranches fetches with params", async () => {
    const response = { data: [{ id: "1", name: "Main" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getBranches(1, 10, "main");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/branch?page=1&limit=10&search=main"));
  });

  it("createBranch sends POST", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new", name: "New Branch" }));
    const result = await createBranch({ name: "New Branch" });
    expect(result.name).toBe("New Branch");
  });

  it("updateBranch sends PATCH", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "1", name: "Updated" }));
    const result = await updateBranch("1", { name: "Updated" });
    expect(result.name).toBe("Updated");
  });

  it("deleteBranch sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await expect(deleteBranch("1")).resolves.toBeUndefined();
  });
});

describe("API client - region", () => {
  it("getRegions fetches with params", async () => {
    const response = { data: [{ id: "1", name: "Region A" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getRegions(1, 10, "A");
    expect(result).toEqual(response);
  });

  it("getRegionMemberCounts fetches", async () => {
    const response = { data: [{ regionId: "1", regionName: "A", memberCount: 10 }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getRegionMemberCounts();
    expect(result.data[0].memberCount).toBe(10);
  });

  it("createRegion sends POST", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new", name: "New", branchId: "b1" }));
    const result = await createRegion({ name: "New", branchId: "b1" });
    expect(result.name).toBe("New");
  });

  it("deleteRegion sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await expect(deleteRegion("1")).resolves.toBeUndefined();
  });
});

describe("API client - user", () => {
  it("getUsers fetches", async () => {
    const response = { data: [{ id: "1", name: "Admin", email: "a@b.com", role: "ADMIN" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getUsers(1, 10, "");
    expect(result.data[0].name).toBe("Admin");
  });

  it("createUser sends POST", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new", name: "User", email: "u@b.com", role: "STAFF" }));
    const result = await createUser({ name: "User", email: "u@b.com", password: "123456", role: "STAFF" });
    expect(result.role).toBe("STAFF");
  });

  it("createUser throws with server error message", async () => {
    mockFetch.mockResolvedValueOnce(Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: "Email already used" }),
    } as Response));
    await expect(createUser({ name: "User", email: "dup@b.com", password: "123456", role: "STAFF" })).rejects.toThrow("Email already used");
  });

  it("deleteUser sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await expect(deleteUser("1")).resolves.toBeUndefined();
  });
});

describe("API client - attendance", () => {
  it("getAttendances fetches", async () => {
    const response = { data: [{ id: "1", serviceDate: new Date(), serviceType: "Sunday Service", maleCount: 10, femaleCount: 15, totalCount: 25 }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getAttendances(1, 10, "");
    expect(result.data[0].totalCount).toBe(25);
  });

  it("createAttendance sends POST", async () => {
    const payload = { serviceDate: "2026-06-01", serviceType: "Sunday", maleCount: 10, femaleCount: 15 };
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new", ...payload, totalCount: 25 }));
    const result = await createAttendance(payload);
    expect(result.totalCount).toBe(25);
  });

  it("deleteAttendance sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await expect(deleteAttendance("1")).resolves.toBeUndefined();
  });
});

describe("API client - birthday", () => {
  it("getBirthdayMembers fetches without date", async () => {
    const response = { data: [], meta: { start: "2026-06-01", end: "2026-06-07" } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getBirthdayMembers();
    expect(result.meta.start).toBe("2026-06-01");
    expect(mockFetch).toHaveBeenCalledWith("/api/birthday");
  });

  it("getBirthdayMembers fetches with date param", async () => {
    const response = { data: [], meta: { start: "2026-06-01", end: "2026-06-07" } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getBirthdayMembers("2026-06-03");
    expect(result.meta.start).toBe("2026-06-01");
    expect(mockFetch).toHaveBeenCalledWith("/api/birthday?date=2026-06-03");
  });
});

describe("API client - rbac-settings", () => {
  it("fetchRoleAccessConfig fetches config", async () => {
    const response = { config: { "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] } } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await fetchRoleAccessConfig();
    expect(result["/dashboard/members"].view).toEqual(["ADMIN"]);
  });

  it("saveRoleAccessConfig sends PUT", async () => {
    const config = { "/dashboard/members": { view: ["ADMIN"], edit: ["ADMIN"] } };
    mockFetch.mockResolvedValueOnce(mockResponse({ config }));
    const result = await saveRoleAccessConfig(config);
    expect(result["/dashboard/members"].view).toEqual(["ADMIN"]);
    expect(mockFetch).toHaveBeenCalledWith("/api/settings/rbac", expect.objectContaining({ method: "PUT" }));
  });
});
