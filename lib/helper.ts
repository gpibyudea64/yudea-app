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
  const page = meta.page ?? meta.currentPage ?? payload.page ?? payload.currentPage ?? fallbackPage;
  const limit = meta.limit ?? meta.perPage ?? payload.limit ?? payload.perPage ?? fallbackLimit;
  const total = meta.total ?? meta.totalItems ?? payload.total ?? payload.totalItems ?? items.length;
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
