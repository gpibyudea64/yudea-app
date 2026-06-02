import { MemberPelkat } from "@/app/generated/prisma/enums";
import { Gender, Member, MemberRole, Prisma } from "@prisma/client";

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

type UnknownPaginatedPayload<T> =
  | T[]
  | {
      items?: T[];
      data?: T[];
      results?: T[];
      meta?: Partial<{
        page: number;
        currentPage: number;
        limit: number;
        perPage: number;
        total: number;
        totalItems: number;
        totalPages: number;
        pageCount: number;
      }>;
      page?: number;
      currentPage?: number;
      limit?: number;
      perPage?: number;
      total?: number;
      totalItems?: number;
      totalPages?: number;
      pageCount?: number;
    };

export function toPaginatedResult<T>(
  payload: UnknownPaginatedPayload<T>,
  fallbackPage: number,
  fallbackLimit: number,
) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      meta: {
        page: fallbackPage,
        limit: fallbackLimit,
        total: payload.length,
        totalPages: Math.max(1, Math.ceil(payload.length / fallbackLimit)),
      },
    };
  }

  const items = payload.items ?? payload.data ?? payload.results ?? [];
  const meta = payload.meta ?? {};
  const page =
    meta.page ??
    meta.currentPage ??
    payload.page ??
    payload.currentPage ??
    fallbackPage;
  const limit =
    meta.limit ??
    meta.perPage ??
    payload.limit ??
    payload.perPage ??
    fallbackLimit;
  const total =
    meta.total ??
    meta.totalItems ??
    payload.total ??
    payload.totalItems ??
    items.length;
  const totalPages =
    meta.totalPages ??
    meta.pageCount ??
    payload.totalPages ??
    payload.pageCount ??
    Math.max(1, Math.ceil(total / limit));

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export function attachPelkat<T extends Member>(member: T) {
  return { ...member, pelkat: determinePelkat(member) };
}

export function determinePelkat(
  member: Pick<Member, "birthDate" | "gender" | "role">,
) {
  const age = calculateAge(member.birthDate);
  const isMarried =
    member.role === MemberRole.FAMILY_HEAD || member.role === MemberRole.WIFE;

  if (isMarried && age < 36) {
    return member.gender === Gender.MALE
      ? MemberPelkat.PERSEKUTUAN_KAUM_BAPAK
      : MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN;
  }
  if (age <= 12) return MemberPelkat.PELAYANAN_ANAK;
  if (age <= 16) return MemberPelkat.PERSEKUTUAN_TARUNA;
  if (age <= 35) return MemberPelkat.GERAKAN_PEMUDA;
  if (age <= 59) {
    return member.gender === Gender.MALE
      ? MemberPelkat.PERSEKUTUAN_KAUM_BAPAK
      : MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN;
  }
  return MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA;
}

export function calculateAge(birthDate: Date) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function buildPelkatWhere(
  pelkat: MemberPelkat,
): Prisma.MemberWhereInput {
  const isMarriedWhere: Prisma.MemberWhereInput = {
    role: { in: [MemberRole.FAMILY_HEAD, MemberRole.WIFE] },
  };
  const activeLivingWhere: Prisma.MemberWhereInput = {
    isActive: true,
    isDeceased: false,
  };

  switch (pelkat) {
    case MemberPelkat.PELAYANAN_ANAK:
      return {
        ...activeLivingWhere,
        birthDate: getBirthDateBetweenAges(0, 12),
        NOT: isMarriedWhere,
      };
    case MemberPelkat.PERSEKUTUAN_TARUNA:
      return {
        ...activeLivingWhere,
        birthDate: getBirthDateBetweenAges(13, 16),
        NOT: isMarriedWhere,
      };
    case MemberPelkat.GERAKAN_PEMUDA:
      return {
        ...activeLivingWhere,
        birthDate: getBirthDateBetweenAges(17, 35),
        NOT: isMarriedWhere,
      };
    case MemberPelkat.PERSEKUTUAN_KAUM_BAPAK:
      return {
        ...activeLivingWhere,
        gender: Gender.MALE,
        OR: [
          { birthDate: getBirthDateBetweenAges(36, 59) },
          { birthDate: getBirthDateUnderAge(36), ...isMarriedWhere },
        ],
      };
    case MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN:
      return {
        ...activeLivingWhere,
        gender: Gender.FEMALE,
        OR: [
          { birthDate: getBirthDateBetweenAges(36, 59) },
          { birthDate: getBirthDateUnderAge(36), ...isMarriedWhere },
        ],
      };
    case MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA:
      return { ...activeLivingWhere, birthDate: getBirthDateAtLeastAge(60) };
  }
}

function getBirthDateBetweenAges(minAge: number, maxAge: number) {
  return {
    gte: addDays(subtractYears(maxAge + 1), 1),
    lte: subtractYears(minAge),
  };
}

function getBirthDateUnderAge(age: number) {
  return {
    gte: addDays(subtractYears(age), 1),
    lte: new Date(),
  };
}

function getBirthDateAtLeastAge(age: number) {
  return { lte: subtractYears(age) };
}

function subtractYears(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
