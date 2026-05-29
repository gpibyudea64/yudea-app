export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type PaginationMeta = PaginatedResponse<unknown>["meta"];

export type SelectOption = {
  label: string;
  value: string;
};
