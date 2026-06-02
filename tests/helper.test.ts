import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Gender,
  MemberPelkat,
  MemberRole,
} from "@/app/generated/prisma/client";
import {
  calculateAge,
  determinePelkat,
  getErrorMessage,
  toPaginatedResult,
  toTitleCase,
} from "@/lib/helper";

describe("helper utilities", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats words as title case", () => {
    expect(toTitleCase("member management")).toBe("Member Management");
  });

  it("reads API-style error messages before falling back", () => {
    expect(
      getErrorMessage({ response: { data: { message: "Email already used" } } }),
    ).toBe("Email already used");
    expect(getErrorMessage(new Error("Boom"))).toBe("Boom");
    expect(getErrorMessage("unknown", "Fallback")).toBe("Fallback");
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
      },
    );
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
});
