import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachPelkat,
  buildPelkatWhere,
  calculateAge,
  determinePelkat,
  getErrorMessage,
  parsePagination,
  toPaginatedResult,
  toTitleCase,
} from "@/lib/helper";
import { Gender, MemberPelkat, MemberRole } from "@prisma/client";

describe("helper utilities", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats words as title case", () => {
    expect(toTitleCase("member management")).toBe("Member Management");
  });

  it("reads API-style error messages before falling back", () => {
    expect(
      getErrorMessage({
        response: { data: { message: "Email already used" } },
      }),
    ).toBe("Email already used");
    expect(getErrorMessage(new Error("Boom"))).toBe("Boom");
    expect(getErrorMessage("unknown", "Fallback")).toBe("Fallback");
  });

  it("parses valid pagination params", () => {
    const params = new URLSearchParams({ page: "3", limit: "25" });
    expect(parsePagination(params)).toEqual({ page: 3, limit: 25 });
  });

  it("falls back to defaults for missing, empty, or non-numeric params", () => {
    expect(parsePagination(new URLSearchParams())).toEqual({
      page: 1,
      limit: 10,
    });
    expect(parsePagination(new URLSearchParams({ page: "abc", limit: "x" }))).toEqual({
      page: 1,
      limit: 10,
    });
    expect(parsePagination(new URLSearchParams({ page: "", limit: "" }))).toEqual({
      page: 1,
      limit: 10,
    });
  });

  it("falls back for zero, negative, and float params", () => {
    expect(parsePagination(new URLSearchParams({ page: "0", limit: "-5" }))).toEqual({
      page: 1,
      limit: 10,
    });
    expect(parsePagination(new URLSearchParams({ page: "1.9", limit: "2.4" }))).toEqual({
      page: 1,
      limit: 2,
    });
  });

  it("caps limit to protect against unbounded queries", () => {
    const params = new URLSearchParams({ page: "1", limit: "999999999999" });
    expect(parsePagination(params).limit).toBe(10_000);
  });

  it("honors custom defaults", () => {
    expect(
      parsePagination(new URLSearchParams(), { page: 5, limit: 50 }),
    ).toEqual({ page: 5, limit: 50 });
  });

  it("normalizes array payloads into pagination metadata", () => {
    expect(toPaginatedResult(["a", "b", "c"], 2, 2)).toEqual({
      items: ["a", "b", "c"],
      meta: {
        page: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
      },
    });
  });

  it("normalizes paginated object payload aliases", () => {
    expect(
      toPaginatedResult(
        {
          results: ["a"],
          meta: {
            currentPage: 3,
            perPage: 5,
            totalItems: 11,
            pageCount: 3,
          },
        },
        1,
        10,
      ),
    ).toEqual({
      items: ["a"],
      meta: {
        page: 3,
        limit: 5,
        total: 11,
        totalPages: 3,
      },
    });
  });

  it("uses items/data/results keys from object payload", () => {
    expect(toPaginatedResult({ items: ["x"], total: 50 }, 1, 10)).toEqual({
      items: ["x"],
      meta: { page: 1, limit: 10, total: 50, totalPages: 5 },
    });
    expect(toPaginatedResult({ data: ["y"], total: 20 }, 1, 5)).toEqual({
      items: ["y"],
      meta: { page: 1, limit: 5, total: 20, totalPages: 4 },
    });
  });

  it("calculates age around birthdays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));

    expect(calculateAge(new Date("2000-06-02T00:00:00Z"))).toBe(26);
    expect(calculateAge(new Date("2000-06-03T00:00:00Z"))).toBe(25);
  });

  it("determines pelkat by age, gender, and family role", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));

    expect(
      determinePelkat({
        birthDate: new Date("2015-01-01T00:00:00Z"),
        gender: Gender.FEMALE,
        role: MemberRole.CHILD,
      }),
    ).toBe(MemberPelkat.PELAYANAN_ANAK);
    expect(
      determinePelkat({
        birthDate: new Date("1998-01-01T00:00:00Z"),
        gender: Gender.MALE,
        role: MemberRole.FAMILY_HEAD,
      }),
    ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_BAPAK);
    expect(
      determinePelkat({
        birthDate: new Date("1960-01-01T00:00:00Z"),
        gender: Gender.FEMALE,
        role: MemberRole.WIFE,
      }),
    ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA);
  });

  it("determines pelkat for all age brackets and roles", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));

    // Married male under 36 -> KAUM_BAPAK
    expect(
      determinePelkat({
        birthDate: new Date("2000-01-01T00:00:00Z"),
        gender: Gender.MALE,
        role: MemberRole.FAMILY_HEAD,
      }),
    ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_BAPAK);

    // Married female under 36 -> KAUM_PEREMPUAN
    expect(
      determinePelkat({
        birthDate: new Date("2000-01-01T00:00:00Z"),
        gender: Gender.FEMALE,
        role: MemberRole.WIFE,
      }),
    ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN);

    // Age 13-16, not married -> TARUNA
    expect(
      determinePelkat({
        birthDate: new Date("2012-01-01T00:00:00Z"),
        gender: Gender.MALE,
        role: MemberRole.CHILD,
      }),
    ).toBe(MemberPelkat.PERSEKUTUAN_TARUNA);

    // Age 17-35, not married -> GERAKAN_PEMUDA
    expect(
      determinePelkat({
        birthDate: new Date("1998-01-01T00:00:00Z"),
        gender: Gender.FEMALE,
        role: MemberRole.CHILD,
      }),
    ).toBe(MemberPelkat.GERAKAN_PEMUDA);

    // Age 36-59, male, not married -> KAUM_BAPAK
    expect(
      determinePelkat({
        birthDate: new Date("1980-01-01T00:00:00Z"),
        gender: Gender.MALE,
        role: MemberRole.CHILD,
      }),
    ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_BAPAK);

    // Age 36-59, female, not married -> KAUM_PEREMPUAN
    expect(
      determinePelkat({
        birthDate: new Date("1980-01-01T00:00:00Z"),
        gender: Gender.FEMALE,
        role: MemberRole.CHILD,
      }),
    ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN);

    // Age 60+ -> LANJUT_USIA
    expect(
      determinePelkat({
        birthDate: new Date("1960-01-01T00:00:00Z"),
        gender: Gender.MALE,
        role: MemberRole.FAMILY_HEAD,
      }),
    ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA);
  });

  it("attaches pelkat to member object", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));

    const member = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      birthDate: new Date("2015-01-01T00:00:00Z"),
      gender: Gender.MALE,
      role: MemberRole.CHILD,
    } as Parameters<typeof attachPelkat>[0];

    const result = attachPelkat(member);
    expect(result.pelkat).toBe(MemberPelkat.PELAYANAN_ANAK);
    expect(result.id).toBe("1");
    expect(result.firstName).toBe("John");
  });
});

describe("buildPelkatWhere", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds where clause for PELAYANAN_ANAK (age 0-12)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));

    const result = buildPelkatWhere(MemberPelkat.PELAYANAN_ANAK);
    expect(result.isActive).toBe(true);
    expect(result.isDeceased).toBe(false);
    expect(result.birthDate).toBeDefined();
    expect(result.NOT).toEqual({
      role: { in: [MemberRole.FAMILY_HEAD, MemberRole.WIFE] },
    });
  });

  it("builds where clause for PERSEKUTUAN_TARUNA (age 13-16)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));

    const result = buildPelkatWhere(MemberPelkat.PERSEKUTUAN_TARUNA);
    expect(result.isActive).toBe(true);
    expect(result.isDeceased).toBe(false);
    expect(result.NOT).toEqual({
      role: { in: [MemberRole.FAMILY_HEAD, MemberRole.WIFE] },
    });
  });

  it("builds where clause for GERAKAN_PEMUDA (age 17-35)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));

    const result = buildPelkatWhere(MemberPelkat.GERAKAN_PEMUDA);
    expect(result.isActive).toBe(true);
    expect(result.isDeceased).toBe(false);
    expect(result.NOT).toEqual({
      role: { in: [MemberRole.FAMILY_HEAD, MemberRole.WIFE] },
    });
  });

  it("builds where clause for PERSEKUTUAN_KAUM_BAPAK", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));

    const result = buildPelkatWhere(MemberPelkat.PERSEKUTUAN_KAUM_BAPAK);
    expect(result.isActive).toBe(true);
    expect(result.isDeceased).toBe(false);
    expect(result.gender).toBe(Gender.MALE);
    expect(result.OR).toBeDefined();
    expect(Array.isArray(result.OR)).toBe(true);
  });

  it("builds where clause for PERSEKUTUAN_KAUM_LANJUT_USIA (age 60+)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));

    const result = buildPelkatWhere(MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA);
    expect(result.isActive).toBe(true);
    expect(result.isDeceased).toBe(false);
    expect(result.birthDate).toEqual({ lte: expect.any(Date) });
  });
});
