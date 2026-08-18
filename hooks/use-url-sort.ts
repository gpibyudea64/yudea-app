"use client";

import { useCallback, useState } from "react";

/**
 * Sort state synced to the URL query string (?sortBy=...&sortOrder=...) so
 * sorting survives refresh and navigation.
 *
 * Initial values come from the server page, which reads `searchParams` —
 * never read window.location in the initializer here, or client hydration
 * will mismatch the server-rendered HTML.
 */
export function useUrlSort(
  initialSortBy: string,
  initialSortOrder: "asc" | "desc" = "asc",
) {
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);

  const handleSort = useCallback(
    (next: string) => {
      const nextOrder =
        next === sortBy ? (sortOrder === "asc" ? "desc" : "asc") : "asc";
      setSortBy(next);
      setSortOrder(nextOrder);
      updateUrlSearchParams({ sortBy: next, sortOrder: nextOrder });
    },
    [sortBy, sortOrder],
  );

  return { sortBy, sortOrder, handleSort };
}

/**
 * Writes the given params into the current URL query string (preserving all
 * existing params like `region`) without triggering a navigation.
 */
function updateUrlSearchParams(updates: Record<string, string>) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    params.set(key, value);
  }
  const qs = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${qs ? `?${qs}` : ""}`,
  );
}
