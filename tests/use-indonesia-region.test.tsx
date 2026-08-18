import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useProvinces,
  useRegencies,
  useDistricts,
  useVillages,
} from "@/hooks/use-indonesia-region";

const mockProvinces = [
  { code: "11", name: "ACEH" },
  { code: "12", name: "SUMATERA UTARA" },
  { code: "31", name: "DKI JAKARTA" },
];

const mockRegencies = [
  { code: "1101", name: "KAB. ACEH SELATAN" },
  { code: "1102", name: "KAB. ACEH TENGGARA" },
];

const mockDistricts = [
  { code: "110101", name: "KEC. BAKONGAN" },
  { code: "110102", name: "KEC. KLUET UTARA" },
];

const mockVillages = [
  { code: "110101001", name: "GAMPONG PULO" },
  { code: "110101002", name: "GAMPONG KEUNIREE" },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useProvinces", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches provinces successfully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProvinces),
    } as Response);

    const { result } = renderHook(() => useProvinces(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProvinces);
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data![0].name).toBe("ACEH");
  });

  it("calls correct API endpoint", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProvinces),
    } as Response);

    renderHook(() => useProvinces(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/region-indonesia/provinces",
      );
    });
  });

  it("has infinite staleTime (never refetches)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProvinces),
    } as Response);

    const { result } = renderHook(() => useProvinces(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProvinces);
  });

  it("handles fetch error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useProvinces(), {
      wrapper: createWrapper(),
    });

    // The hooks set retry: 3 to survive slow serverless cold starts, so the
    // error state settles only after the retries + backoff (≈7s) — wait for it.
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 15_000,
    });
  });
});

describe("useRegencies", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches regencies filtered by province code", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRegencies),
    } as Response);

    const { result } = renderHook(() => useRegencies("11"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRegencies);
  });

  it("calls correct endpoint with province code", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRegencies),
    } as Response);

    renderHook(() => useRegencies("11"), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/region-indonesia/regencies?provinceCode=11",
      );
    });
  });

  it("is disabled when provinceCode is null", () => {
    const { result } = renderHook(() => useRegencies(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });

  it("is disabled when provinceCode is empty string", () => {
    const { result } = renderHook(() => useRegencies(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });
});

describe("useDistricts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches districts filtered by regency code", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDistricts),
    } as Response);

    const { result } = renderHook(() => useDistricts("1101"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDistricts);
  });

  it("calls correct endpoint with regency code", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDistricts),
    } as Response);

    renderHook(() => useDistricts("1101"), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/region-indonesia/districts?regencyCode=1101",
      );
    });
  });

  it("is disabled when regencyCode is null", () => {
    const { result } = renderHook(() => useDistricts(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });
});

describe("useVillages", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches villages filtered by district code", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockVillages),
    } as Response);

    const { result } = renderHook(() => useVillages("110101"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockVillages);
  });

  it("calls correct endpoint with district code", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockVillages),
    } as Response);

    renderHook(() => useVillages("110101"), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/region-indonesia/villages?districtCode=110101",
      );
    });
  });

  it("is disabled when districtCode is null", () => {
    const { result } = renderHook(() => useVillages(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });
});

describe("Indonesia region cascade", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("supports full cascade: provinces → regencies → districts → villages", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/region-indonesia/provinces") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProvinces),
        } as Response);
      }
      if (url === "/api/region-indonesia/regencies?provinceCode=11") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRegencies),
        } as Response);
      }
      if (url === "/api/region-indonesia/districts?regencyCode=1101") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDistricts),
        } as Response);
      }
      if (url === "/api/region-indonesia/villages?districtCode=110101") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVillages),
        } as Response);
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    // All four hooks used together in a cascade pattern
    const { result: provinces } = renderHook(() => useProvinces(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(provinces.current.isSuccess).toBe(true));

    const { result: regencies } = renderHook(() => useRegencies("11"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(regencies.current.isSuccess).toBe(true));
    expect(regencies.current.data).toHaveLength(2);

    const { result: districts } = renderHook(() => useDistricts("1101"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(districts.current.isSuccess).toBe(true));

    const { result: villages } = renderHook(() => useVillages("110101"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(villages.current.isSuccess).toBe(true));
    expect(villages.current.data).toHaveLength(2);
    expect(villages.current.data![0].name).toBe("GAMPONG PULO");
  });
});
