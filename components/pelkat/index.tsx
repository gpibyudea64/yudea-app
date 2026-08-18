"use client";

import { useMembers } from "@/hooks/use-member";
import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DataTablePelkatControls } from "./data-table-pelkat-control";
import { Button } from "../ui/button";
import { SortableHeader } from "../ui/sortable-header";
import { Download, FileText, Printer } from "lucide-react";
import { buildMemberAddress, formatLabel, formatDate } from "@/lib/client-helper";

type ExportRow = {
  familyName: string;
  fullName: string;
  address: string;
  birthDate: string;
  regionName: string;
};

function enrichMembers(
  members: Array<{
    id: string;
    firstName: string;
    lastName?: string | null;
    birthDate: string | Date;
    family?: {
      familyName?: string;
      address?: string | null;
      kotaKabupaten?: string | null;
      kecamatan?: string | null;
      region?: { name?: string } | null;
    } | null;
    pelkat?: string | null;
  }>,
): (ExportRow & {
  id: string;
  pelkat: string | null | undefined;
  firstName: string;
  lastName: string | null | undefined;
})[] {
  return members.map((member) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName ?? null,
    familyName: member.family?.familyName ?? "",
    fullName: [member.firstName, member.lastName ?? ""].filter(Boolean).join(" "),
    address: buildMemberAddress(member),
    birthDate: member.birthDate instanceof Date
      ? member.birthDate.toISOString()
      : member.birthDate,
    regionName: member.family?.region?.name ?? "",
    pelkat: member.pelkat,
  }));
}

const ExportXLSButton = memo(function ExportXLSButton({
  rows,
  pelkat,
}: {
  rows: ExportRow[];
  pelkat: string;
}) {
  return (
    <Button
      onClick={async () => {
        if (!rows.length) return;

        const XLSX = await import("xlsx");

        const worksheetData = rows.map((row) => ({
          "Nama Keluarga": row.familyName,
          "Nama Jemaat": row.fullName,
          Alamat: row.address,
          "Tanggal Lahir": formatDate(row.birthDate),
          "Sektor Pelayanan": row.regionName,
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pelkat Members");

        // Auto-fit column widths
        const colWidths = Object.keys(worksheetData[0] || {}).map((key) => ({
          wch: Math.max(
            key.length,
            ...worksheetData.map((row) =>
              String(row[key as keyof typeof row]).length,
            ),
          ) + 2,
        }));
        worksheet["!cols"] = colWidths;

        const fileData = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const blob = new Blob([fileData], {
          type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const pelkatSuffix =
          pelkat !== "all" ? pelkat.toLowerCase().replaceAll("_", "-") : "all";
        link.download = `pelkat-members-${pelkatSuffix}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      }}
      disabled={rows.length === 0}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export XLS
    </Button>
  );
});

export default function PelkatMenu() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState({
    search: "",
    pelkat: "all",
  });
  const [sortBy, setSortBy] = useState("firstName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { data, isLoading } = useMembers({
    page,
    limit,
    pelkat: filter.pelkat,
    search: filter.search,
    sortBy,
    sortOrder,
  });

  function handleSort(next: string) {
    setSortBy(next);
    setSortOrder(next === sortBy ? (sortOrder === "asc" ? "desc" : "asc") : "asc");
    setPage(1);
  }
  const members = data?.data ?? [];
  const enrichedMembers = enrichMembers(members);
  const totalCount = enrichedMembers.length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
            Pelkat Members
          </h1>
          <p className="text-muted-foreground">
            Warga Jemaat grouped by their calculated pelkat category
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Pelkat Records</CardTitle>
            <div className="flex items-center gap-2">
              <ExportXLSButton rows={enrichedMembers} pelkat={filter.pelkat} />
              <Button
                onClick={() => window.print()}
                disabled={enrichedMembers.length === 0}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Cetak PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DataTablePelkatControls
              search={filter.search}
              onSearchChange={(value) =>
                setFilter({ ...filter, search: value })
              }
              searchPlaceholder="Search members or Keluarga..."
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
              pelkat={filter.pelkat}
              onPelkatChange={(value) =>
                setFilter({ ...filter, pelkat: value })
              }
            />
            <div className="mb-3 px-4 pt-3 text-sm text-muted-foreground">
              {isLoading ? (
                <span>Memuat data...</span>
              ) : (
                <span>
                  Menampilkan <strong>{totalCount}</strong> warga jemaat
                  {filter.pelkat !== "all" && (
                    <>
                      {" "}dari PELKAT{" "}
                      <strong>{formatLabel(filter.pelkat)}</strong>
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">No</TableHead>
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Nama Keluarga"
                        sortBy="familyFamilyName"
                        currentSortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Nama Jemaat"
                        sortBy="firstName"
                        currentSortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Alamat</TableHead>
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Tanggal Lahir"
                        sortBy="birthDate"
                        currentSortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Sektor Pelayanan"
                        sortBy="familyRegionName"
                        currentSortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Pelkat"
                        sortBy="pelkat"
                        currentSortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                          <p className="text-muted-foreground">
                            Loading pelkat data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : enrichedMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No pelkat records found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrichedMembers.map((member, index) => (
                      <TableRow
                        key={member.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {member.familyName}
                        </TableCell>
                        <TableCell>{member.fullName}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {member.address}
                        </TableCell>
                        <TableCell>{formatDate(member.birthDate)}</TableCell>
                        <TableCell>{member.regionName}</TableCell>
                        <TableCell>
                          {member.pelkat ? formatLabel(member.pelkat) : ""}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
