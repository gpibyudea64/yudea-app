import { useQuery } from "@tanstack/react-query";

export interface RegionOption {
  code: string;
  name: string;
}

async function fetchRegion<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch region data");
  return res.json();
}

/**
 * Fetch all Indonesian provinces.
 * This is loaded once and cached since province list is stable.
 */
export function useProvinces() {
  return useQuery({
    queryKey: ["region-indonesia", "provinces"],
    queryFn: () => fetchRegion<RegionOption[]>("/api/region-indonesia/provinces"),
    staleTime: Infinity, // Province data never changes
    gcTime: Infinity,
  });
}

/**
 * Fetch regencies (kota/kabupaten) filtered by province code.
 * Only enabled when `provinceCode` is provided.
 */
export function useRegencies(provinceCode: string | null) {
  return useQuery({
    queryKey: ["region-indonesia", "regencies", provinceCode],
    queryFn: () =>
      fetchRegion<RegionOption[]>(
        `/api/region-indonesia/regencies?provinceCode=${provinceCode}`,
      ),
    enabled: !!provinceCode,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Fetch districts (kecamatan) filtered by regency code.
 * Only enabled when `regencyCode` is provided.
 */
export function useDistricts(regencyCode: string | null) {
  return useQuery({
    queryKey: ["region-indonesia", "districts", regencyCode],
    queryFn: () =>
      fetchRegion<RegionOption[]>(
        `/api/region-indonesia/districts?regencyCode=${regencyCode}`,
      ),
    enabled: !!regencyCode,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Fetch villages (kelurahan) filtered by district code.
 * Only enabled when `districtCode` is provided.
 */
export function useVillages(districtCode: string | null) {
  return useQuery({
    queryKey: ["region-indonesia", "villages", districtCode],
    queryFn: () =>
      fetchRegion<RegionOption[]>(
        `/api/region-indonesia/villages?districtCode=${districtCode}`,
      ),
    enabled: !!districtCode,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
