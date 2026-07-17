import type { PaginatedResponse } from "@/types/shared";

/**
 * Build a query string from a params object, skipping undefined/empty values.
 */
function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

/**
 * Generic paginated list fetch.
 */
export async function fetchList<T>(
  url: string,
  params: Record<string, string | number | undefined> = {},
): Promise<PaginatedResponse<T>> {
  const query = buildQueryString(params);
  const fullUrl = query ? `${url}?${query}` : url;
  const res = await fetch(fullUrl);
  if (!res.ok) throw new Error(`Failed to fetch from ${url}`);
  return res.json();
}

/**
 * Generic single-resource fetch.
 */
export async function fetchOne<T>(url: string, id: string): Promise<T> {
  const res = await fetch(`${url}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch ${url}/${id}`);
  return res.json();
}

/**
 * Generic POST create.
 */
export async function createOne<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create at ${url}`);
  return res.json();
}

/**
 * Generic PATCH update.
 */
export async function updateOne<T>(
  url: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${url}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update ${url}/${id}`);
  return res.json();
}

/**
 * Generic DELETE.
 */
export async function deleteOne(url: string, id: string): Promise<void> {
  const res = await fetch(`${url}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete ${url}/${id}`);
}
