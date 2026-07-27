import { afterEach, describe, expect, it, vi } from "vitest";
import { getMembers, getMember, createMember, updateMember, deleteMember, getPresbyters } from "@/lib/api/member";
import { getFamilies, getFamily, createFamily, updateFamily, deleteFamily } from "@/lib/api/family";
import { getBranches, getBranch, createBranch, updateBranch, deleteBranch } from "@/lib/api/branch";
import { getRegions, getRegion, createRegion, updateRegion, deleteRegion, getRegionMemberCounts } from "@/lib/api/region";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/api/user";
import { getAttendances, getAttendance, createAttendance, updateAttendance, deleteAttendance } from "@/lib/api/attendance";
import { getBirthdayMembers } from "@/lib/api/birthday";
import { fetchRoleAccessConfig, saveRoleAccessConfig } from "@/lib/api/rbac-settings";
import { fetchList, fetchOne, createOne, updateOne, deleteOne } from "@/lib/api/client";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

afterEach(() => {
  vi.resetAllMocks();
});

function mockResponse(data: unknown, ok = true): Promise<Response> {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  } as Response);
}

// ─── Member ─────────────────────────────────────────────────────────────────

describe("API client - member", () => {
  it("getMembers fetches with correct params", async () => {
    const response = { data: [{ id: "1", firstName: "John" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getMembers(1, 10, "john", "region-1", "all", "firstName", "asc");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/member?page=1&limit=10&sortBy=firstName&sortOrder=asc&search=john&region=region-1"));
  });

  it("getMembers omits search when not provided", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }));
    await getMembers();
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).not.toContain("search=");
    expect(callUrl).toContain("region=all");
    expect(callUrl).toContain("pelkat=all");
    expect(callUrl).toContain("sortBy=firstName");
  });

  it("getPresbyters fetches presbyter endpoint", async () => {
    const response = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getPresbyters(1, 10, "", "all");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/member/presbyter"));
  });

  it("getPresbyters includes search and region params", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }));
    await getPresbyters(1, 10, "john", "region-1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("search=john&region=region-1"));
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

  it("throws on failed GET request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Not found" }, false));
    await expect(getMember("999")).rejects.toThrow("Failed to fetch member");
  });

  it("throws on failed POST request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Bad request" }, false));
    await expect(createMember({ firstName: "John" } as Parameters<typeof createMember>[0])).rejects.toThrow("Failed to create member");
  });

  it("throws on failed PATCH request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Conflict" }, false));
    await expect(updateMember("1", { firstName: "Jane" })).rejects.toThrow("Failed to update member");
  });

  it("throws on failed DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Forbidden" }, false));
    await expect(deleteMember("1")).rejects.toThrow("Failed to delete member");
  });
});

// ─── Family ──────────────────────────────────────────────────────────────────

describe("API client - family", () => {
  it("getFamilies fetches with sort params", async () => {
    const response = { data: [{ id: "1", familyName: "Smith" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getFamilies(1, 10, "", "familyName", "asc");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/family?page=1&limit=10&sortBy=familyName&sortOrder=asc"));
  });

  it("getFamilies includes search when provided", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }));
    await getFamilies(1, 10, "Smith");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("search=Smith"));
  });

  it("getFamily fetches by id", async () => {
    const response = { id: "1", familyName: "Smith", regionId: "r1" };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getFamily("1");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith("/api/family/1");
  });

  it("createFamily sends POST", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new", familyName: "Smith", regionId: "r1" }));
    const result = await createFamily({ familyName: "Smith", regionId: "r1" } as Parameters<typeof createFamily>[0]);
    expect(result.id).toBe("new");
    expect(mockFetch).toHaveBeenCalledWith("/api/family", expect.objectContaining({ method: "POST" }));
  });

  it("updateFamily sends PATCH", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "1", familyName: "Updated", regionId: "r1" }));
    const result = await updateFamily("1", { familyName: "Updated" });
    expect(result.familyName).toBe("Updated");
    expect(mockFetch).toHaveBeenCalledWith("/api/family/1", expect.objectContaining({ method: "PATCH" }));
  });

  it("deleteFamily sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await deleteFamily("1");
    expect(mockFetch).toHaveBeenCalledWith("/api/family/1", { method: "DELETE" });
  });

  it("throws on failed GET request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Not found" }, false));
    await expect(getFamily("999")).rejects.toThrow("Failed to fetch Sektor Pelayanan");
  });

  it("throws on failed POST request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Bad request" }, false));
    await expect(createFamily({} as Parameters<typeof createFamily>[0])).rejects.toThrow("Failed to create family");
  });

  it("throws on failed PATCH request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Conflict" }, false));
    await expect(updateFamily("1", { familyName: "X" })).rejects.toThrow("Failed to update family");
  });

  it("throws on failed DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Forbidden" }, false));
    await expect(deleteFamily("1")).rejects.toThrow("Failed to delete family");
  });
});

// ─── Branch ──────────────────────────────────────────────────────────────────

describe("API client - branch", () => {
  it("getBranches fetches with params", async () => {
    const response = { data: [{ id: "1", name: "Main" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getBranches(1, 10, "main");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/branch?page=1&limit=10&search=main"));
  });

  it("getBranches omits search when not provided", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }));
    await getBranches();
    expect(mockFetch.mock.calls[0][0]).not.toContain("search=");
  });

  it("getBranch fetches by id", async () => {
    const response = { id: "1", name: "Main Branch" };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getBranch("1");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith("/api/branch/1");
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

  it("throws on failed GET request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Not found" }, false));
    await expect(getBranch("999")).rejects.toThrow("Failed to fetch branch");
  });

  it("throws on failed POST request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Bad request" }, false));
    await expect(createBranch({ name: "" })).rejects.toThrow("Failed to create branch");
  });

  it("throws on failed PATCH request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Conflict" }, false));
    await expect(updateBranch("1", { name: "X" })).rejects.toThrow("Failed to update branch");
  });

  it("throws on failed DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Forbidden" }, false));
    await expect(deleteBranch("1")).rejects.toThrow("Failed to delete branch");
  });
});

// ─── Region ──────────────────────────────────────────────────────────────────

describe("API client - region", () => {
  it("getRegions fetches with params", async () => {
    const response = { data: [{ id: "1", name: "Region A" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getRegions(1, 10, "A");
    expect(result).toEqual(response);
  });

  it("getRegions omits search when not provided", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }));
    await getRegions();
    expect(mockFetch.mock.calls[0][0]).not.toContain("search=");
  });

  it("getRegion fetches by id", async () => {
    const response = { id: "1", name: "Region A", branchId: "b1" };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getRegion("1");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith("/api/region/1");
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

  it("updateRegion sends PATCH", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "1", name: "Updated", branchId: "b1" }));
    const result = await updateRegion("1", { name: "Updated" });
    expect(result.name).toBe("Updated");
    expect(mockFetch).toHaveBeenCalledWith("/api/region/1", expect.objectContaining({ method: "PATCH" }));
  });

  it("deleteRegion sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await expect(deleteRegion("1")).resolves.toBeUndefined();
  });

  it("throws on failed GET request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Not found" }, false));
    await expect(getRegion("999")).rejects.toThrow("Failed to fetch region");
  });

  it("throws on failed POST request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Bad request" }, false));
    await expect(createRegion({ name: "", branchId: "" })).rejects.toThrow("Failed to create region");
  });

  it("throws on failed PATCH request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Conflict" }, false));
    await expect(updateRegion("1", { name: "X" })).rejects.toThrow("Failed to update region");
  });

  it("throws on failed DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Forbidden" }, false));
    await expect(deleteRegion("1")).rejects.toThrow("Failed to delete region");
  });
});

// ─── User ────────────────────────────────────────────────────────────────────

describe("API client - user", () => {
  it("getUsers fetches", async () => {
    const response = { data: [{ id: "1", name: "Admin", email: "a@b.com", role: "ADMIN" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getUsers(1, 10, "");
    expect(result.data[0].name).toBe("Admin");
  });

  it("getUsers includes search when provided", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }));
    await getUsers(1, 10, "admin");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("search=admin"));
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

  it("createUser throws with fallback when no server error", async () => {
    mockFetch.mockResolvedValueOnce(Promise.resolve({
      ok: false,
      json: () => Promise.reject(new Error("parse failed")),
    } as Response));
    await expect(createUser({ name: "User", email: "x@b.com", password: "123456", role: "STAFF" })).rejects.toThrow("Failed to create user");
  });

  it("updateUser sends PATCH", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "1", name: "Updated", email: "a@b.com", role: "ADMIN" }));
    const result = await updateUser("1", { name: "Updated" });
    expect(result.name).toBe("Updated");
    expect(mockFetch).toHaveBeenCalledWith("/api/user/1", expect.objectContaining({ method: "PATCH" }));
  });

  it("updateUser throws with server error message", async () => {
    mockFetch.mockResolvedValueOnce(Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: "Email conflict" }),
    } as Response));
    await expect(updateUser("1", { email: "dup@b.com" })).rejects.toThrow("Email conflict");
  });

  it("updateUser throws with fallback when no server error", async () => {
    mockFetch.mockResolvedValueOnce(Promise.resolve({
      ok: false,
      json: () => Promise.reject(new Error("parse failed")),
    } as Response));
    await expect(updateUser("1", { name: "X" })).rejects.toThrow("Failed to update user");
  });

  it("deleteUser sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await expect(deleteUser("1")).resolves.toBeUndefined();
  });

  it("deleteUser throws with server error message", async () => {
    mockFetch.mockResolvedValueOnce(Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: "Cannot delete last admin" }),
    } as Response));
    await expect(deleteUser("1")).rejects.toThrow("Cannot delete last admin");
  });

  it("deleteUser throws with fallback when no server error", async () => {
    mockFetch.mockResolvedValueOnce(Promise.resolve({
      ok: false,
      json: () => Promise.reject(new Error("parse failed")),
    } as Response));
    await expect(deleteUser("1")).rejects.toThrow("Failed to delete user");
  });
});

// ─── Attendance ──────────────────────────────────────────────────────────────

describe("API client - attendance", () => {
  it("getAttendances fetches", async () => {
    const response = { data: [{ id: "1", serviceDate: new Date(), serviceType: "Sunday Service", maleCount: 10, femaleCount: 15, totalCount: 25 }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getAttendances(1, 10, "");
    expect(result.data[0].totalCount).toBe(25);
  });

  it("getAttendances includes search when provided", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }));
    await getAttendances(1, 10, "Sunday");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("search=Sunday"));
  });

  it("getAttendance fetches by id", async () => {
    const response = { id: "1", serviceDate: new Date(), serviceType: "Sunday", maleCount: 10, femaleCount: 15, totalCount: 25 };
    mockFetch.mockResolvedValueOnce(mockResponse(response));
    const result = await getAttendance("1");
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith("/api/attendance/1");
  });

  it("createAttendance sends POST", async () => {
    const payload = { serviceDate: "2026-06-01", serviceType: "Sunday", maleCount: 10, femaleCount: 15 };
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new", ...payload, totalCount: 25 }));
    const result = await createAttendance(payload);
    expect(result.totalCount).toBe(25);
  });

  it("updateAttendance sends PATCH", async () => {
    const payload = { maleCount: 20 };
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "1", serviceDate: new Date(), serviceType: "Sunday", maleCount: 20, femaleCount: 15, totalCount: 35 }));
    const result = await updateAttendance("1", payload);
    expect(result.maleCount).toBe(20);
    expect(mockFetch).toHaveBeenCalledWith("/api/attendance/1", expect.objectContaining({ method: "PATCH" }));
  });

  it("deleteAttendance sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await expect(deleteAttendance("1")).resolves.toBeUndefined();
  });

  it("throws on failed GET request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Not found" }, false));
    await expect(getAttendance("999")).rejects.toThrow("Failed to fetch attendance");
  });

  it("throws on failed POST request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Bad request" }, false));
    await expect(createAttendance({} as Parameters<typeof createAttendance>[0])).rejects.toThrow("Failed to create attendance");
  });

  it("throws on failed PATCH request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Conflict" }, false));
    await expect(updateAttendance("1", { maleCount: 99 })).rejects.toThrow("Failed to update attendance");
  });

  it("throws on failed DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Forbidden" }, false));
    await expect(deleteAttendance("1")).rejects.toThrow("Failed to delete attendance");
  });
});

// ─── Birthday ────────────────────────────────────────────────────────────────

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

  it("throws on failed request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Server error" }, false));
    await expect(getBirthdayMembers()).rejects.toThrow("Failed to fetch birthday members");
  });
});

// ─── RBAC Settings ──────────────────────────────────────────────────────────

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

  it("fetchRoleAccessConfig throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Not found" }, false));
    await expect(fetchRoleAccessConfig()).rejects.toThrow("Failed to load role access settings");
  });

  it("saveRoleAccessConfig throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Bad request" }, false));
    await expect(saveRoleAccessConfig({} as Parameters<typeof saveRoleAccessConfig>[0])).rejects.toThrow("Failed to save role access settings");
  });
});

// ─── Generic client helpers ──────────────────────────────────────────────────

describe("API client - generic helpers", () => {
  it("fetchList builds query string from params", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [{ id: "1" }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } }));
    const result = await fetchList("/api/test", { page: 1, limit: 10, search: "test" });
    expect(result.data).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/test?page=1&limit=10&search=test");
  });

  it("fetchList skips undefined and empty params", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }));
    await fetchList("/api/test", { page: 1, search: undefined, extra: "" as string | undefined });
    expect(mockFetch).toHaveBeenCalledWith("/api/test?page=1");
  });

  it("fetchList omits query string when no params", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }));
    await fetchList("/api/test");
    expect(mockFetch).toHaveBeenCalledWith("/api/test");
  });

  it("fetchList throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Error" }, false));
    await expect(fetchList("/api/test")).rejects.toThrow("Failed to fetch from /api/test");
  });

  it("fetchOne fetches by id", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "1", name: "Item" }));
    const result = await fetchOne("/api/test", "1");
    expect(result).toEqual({ id: "1", name: "Item" });
    expect(mockFetch).toHaveBeenCalledWith("/api/test/1");
  });

  it("fetchOne throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Not found" }, false));
    await expect(fetchOne("/api/test", "999")).rejects.toThrow("Failed to fetch /api/test/999");
  });

  it("createOne sends POST with payload", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new", name: "Created" }));
    const result = await createOne("/api/test", { name: "Created" });
    expect(result).toEqual({ id: "new", name: "Created" });
    expect(mockFetch).toHaveBeenCalledWith("/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Created" }),
    });
  });

  it("createOne throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Bad request" }, false));
    await expect(createOne("/api/test", { name: "" })).rejects.toThrow("Failed to create at /api/test");
  });

  it("updateOne sends PATCH with payload", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "1", name: "Updated" }));
    const result = await updateOne("/api/test", "1", { name: "Updated" });
    expect(result).toEqual({ id: "1", name: "Updated" });
    expect(mockFetch).toHaveBeenCalledWith("/api/test/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
  });

  it("updateOne throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Conflict" }, false));
    await expect(updateOne("/api/test", "1", { name: "X" })).rejects.toThrow("Failed to update /api/test/1");
  });

  it("deleteOne sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null));
    await expect(deleteOne("/api/test", "1")).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith("/api/test/1", { method: "DELETE" });
  });

  it("deleteOne throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Forbidden" }, false));
    await expect(deleteOne("/api/test", "1")).rejects.toThrow("Failed to delete /api/test/1");
  });
});
