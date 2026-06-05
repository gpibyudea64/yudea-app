"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { useRegions } from "@/hooks/use-region";
import { toTitleCase } from "@/lib/helper";
import { MemberPelkat } from "@prisma/client";
import { formatPelkatName } from "@/lib/client-helper";

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function DataTableMemberControls({
  search,
  onSearchChange,
  searchPlaceholder,
  meta,
  onPageChange,
  onLimitChange,
  region,
  onPelkatChange,
  onRegionChange,
  pelkat,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  region: string;
  onRegionChange: (value: string) => void;
  pelkat: string;
  onPelkatChange: (value: string) => void;
  searchPlaceholder: string;
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const page = meta?.page ?? 1;
  const limit = meta?.limit ?? 10;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);
  const { data } = useRegions(1, 999, "");

  const regionOptions =
    data?.data.map((region) => ({
      label: region.name,
      value: region.id,
    })) ?? [];

  const pelkatOptions = [
    {
      label: formatPelkatName(MemberPelkat.PELAYANAN_ANAK),
      value: MemberPelkat.PELAYANAN_ANAK,
    },
    {
      label: formatPelkatName(MemberPelkat.PERSEKUTUAN_TARUNA),
      value: MemberPelkat.PERSEKUTUAN_TARUNA,
    },
    {
      label: formatPelkatName(MemberPelkat.GERAKAN_PEMUDA),
      value: MemberPelkat.GERAKAN_PEMUDA,
    },
    {
      label: formatPelkatName(MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN),
      value: MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN,
    },
    {
      label: formatPelkatName(MemberPelkat.PERSEKUTUAN_KAUM_BAPAK),
      value: MemberPelkat.PERSEKUTUAN_KAUM_BAPAK,
    },
    {
      label: formatPelkatName(MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA),
      value: MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA,
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              onSearchChange(event.target.value);
              onPageChange(1);
            }}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          <span>
            Showing {start}-{end} of {total}
          </span>

          <div className="flex items-center gap-2">
            <Select
              value={String(limit)}
              onValueChange={(value) => {
                onLimitChange(Number(value));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    {item} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-20 text-center">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
        <Select
          value={region}
          onValueChange={(value) => {
            onRegionChange(value);
            onPageChange(1);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regionOptions.map((item) => (
              <SelectItem key={item.value} value={String(item.value)}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={pelkat}
          onValueChange={(value) => {
            onPelkatChange(value);
            onPageChange(1);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pelkat</SelectItem>
            {pelkatOptions.map((item) => (
              <SelectItem key={item.value} value={String(item.value)}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
