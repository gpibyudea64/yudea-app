import { describe, expect, it, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUrlSort } from "@/hooks/use-url-sort";

afterEach(() => {
  // Reset the URL so tests don't leak query params into each other.
  window.history.replaceState(null, "", "/dashboard/members");
});

describe("useUrlSort", () => {
  it("initializes from props", () => {
    const { result } = renderHook(() =>
      useUrlSort("email", "asc"),
    );
    expect(result.current.sortBy).toBe("email");
    expect(result.current.sortOrder).toBe("asc");
  });

  it("applies default sort order when not provided", () => {
    const { result } = renderHook(() => useUrlSort("name"));
    expect(result.current.sortBy).toBe("name");
    expect(result.current.sortOrder).toBe("asc");
  });

  it("toggles asc/desc when sorting the active column", () => {
    const { result } = renderHook(() => useUrlSort("name", "asc"));

    act(() => {
      result.current.handleSort("name");
    });
    expect(result.current.sortBy).toBe("name");
    expect(result.current.sortOrder).toBe("desc");

    act(() => {
      result.current.handleSort("name");
    });
    expect(result.current.sortOrder).toBe("asc");
  });

  it("resets to asc when sorting a new column", () => {
    const { result } = renderHook(() => useUrlSort("name", "desc"));

    act(() => {
      result.current.handleSort("email");
    });
    expect(result.current.sortBy).toBe("email");
    expect(result.current.sortOrder).toBe("asc");
  });

  it("writes sort params to the URL query string", () => {
    const { result } = renderHook(() => useUrlSort("name", "asc"));

    act(() => {
      result.current.handleSort("branchName");
    });

    expect(window.location.search).toContain("sortBy=branchName");
    expect(window.location.search).toContain("sortOrder=asc");
  });

  it("preserves existing URL params when sorting", () => {
    window.history.replaceState(null, "", "/dashboard/members?region=r1");
    const { result } = renderHook(() => useUrlSort("firstName", "asc"));

    act(() => {
      result.current.handleSort("firstName");
    });

    expect(window.location.search).toContain("region=r1");
    expect(window.location.search).toContain("sortBy=firstName");
    expect(window.location.search).toContain("sortOrder=desc");
  });
});
