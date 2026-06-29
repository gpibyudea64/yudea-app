"use client";

import { usePageAccess } from "@/hooks/use-page-access";
import { useDeleteRegion, useRegions } from "@/hooks/use-region";
import { useMembers } from "@/hooks/use-member";
import { Region } from "@/types/region";
import type { Member } from "@/types/member";
import { memo, useState } from "react";
import { Button } from "../ui/button";
import {
  Calendar,
  Church,
  Download,
  Edit,
  FileSpreadsheet,
  FileText,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import RegionDialog from "./region-dialog";
import { DataTableControls } from "../ui/data-table-controls";
import { buildMemberAddress } from "@/lib/client-helper";

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type ExportRow = {
  familyName: string;
  fullName: string;
  address: string;
  birthDate: string;
  regionName: string;
};

const ExportXLSButton = memo(function ExportXLSButton({
  rows,
  region,
}: {
  rows: ExportRow[];
  region: string;
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
        XLSX.utils.book_append_sheet(workbook, worksheet, "Warga Jemaat");

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
        const regionSuffix = region !== "all" ? `sektor-${region.slice(0, 8)}` : "all-sektor";
        link.download = `warga-jemaat-${regionSuffix}.xlsx`;
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

export default function Regions() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { canEdit } = usePageAccess("/dashboard/regions");
  const { data, isLoading } = useRegions(page, limit, search);
  const deleteMutation = useDeleteRegion();
  const { data: allRegionsData } = useRegions(1, 999);

  const regionOptions =
    allRegionsData?.data?.map((r) => ({ label: r.name, value: r.id })) ?? [];

  const regions = data?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);

  // Export state
  const [exportRegion, setExportRegion] = useState("all");
  const { data: membersData, isLoading: membersLoading } = useMembers({
    page: 1,
    limit: 9999,
    region: exportRegion,
  });
  const members = membersData?.data ?? [];
  const enrichedMembers: (ExportRow & { id: string })[] = members.map(
    (member: Member) => ({
      id: member.id,
      familyName: member.family?.familyName ?? "",
      fullName:
        [member.firstName, member.lastName ?? ""].filter(Boolean).join(" "),
      address: buildMemberAddress(member),
      birthDate:
        member.birthDate instanceof Date
          ? member.birthDate.toISOString()
          : member.birthDate,
      regionName: member.family?.region?.name ?? "",
    }),
  );

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: Region) {
    setEditing(item);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Delete this Sektor Pelayanan?");
    if (!confirmed) return;
    deleteMutation.mutateAsync(id);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Sektor Pelayanan Management
            </h1>
            <p className="text-muted-foreground">
              Track and manage Sektor Pelayanan and export Warga Jemaat data
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={openCreate}
              className="shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Sektor Pelayanan
            </Button>
          )}
        </div>

        {/* Region List Table */}
        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sektor Pelayanan Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableControls
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search Sektor Pelayanan or Wilayah Pelayanan..."
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Branch</TableHead>
                    {canEdit && (
                      <TableHead className="font-semibold text-center w-40">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 3 : 2}
                        className="text-center py-12"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-muted-foreground">
                            Loading regions data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : regions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 3 : 2}
                        className="text-center py-12"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Church className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No Sektor Pelayanan records found
                          </p>
                          {canEdit && (
                            <Button
                              variant="outline"
                              onClick={openCreate}
                              className="mt-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create First Record
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    regions.map((item: Region) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>

                        <TableCell className="font-medium">
                          {item.branch?.name ?? ""}
                        </TableCell>

                        {canEdit && (
                          <TableCell>
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(item)}
                                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                                className="hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Export Data Section */}
        <Card className="shadow-xl print:shadow-none print:border-0">
          <CardHeader className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Export Data Warga Jemaat
            </CardTitle>
            <div className="flex items-center gap-2">
              <ExportXLSButton rows={enrichedMembers} region={exportRegion} />
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
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Sektor Pelayanan
                </label>
                <Select
                  value={exportRegion}
                  onValueChange={(value) => {
                    setExportRegion(value);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Pilih Sektor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Sektor</SelectItem>
                    {regionOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              {membersLoading ? (
                <span>Memuat data...</span>
              ) : (
                <span>
                  Menampilkan <strong>{enrichedMembers.length}</strong> warga
                  jemaat
                  {exportRegion !== "all" && (
                    <>
                      {" "}di Sektor{" "}
                      <strong>
                        {regionOptions.find((r) => r.value === exportRegion)
                          ?.label ?? exportRegion}
                      </strong>
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="overflow-x-auto mt-3">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">No</TableHead>
                    <TableHead className="font-semibold">
                      Nama Keluarga
                    </TableHead>
                    <TableHead className="font-semibold">
                      Nama Jemaat
                    </TableHead>
                    <TableHead className="font-semibold">Alamat</TableHead>
                    <TableHead className="font-semibold">
                      Tanggal Lahir
                    </TableHead>
                    <TableHead className="font-semibold">
                      Sektor Pelayanan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          <p className="text-muted-foreground">
                            Loading warga jemaat data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : enrichedMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            Pilih Sektor untuk menampilkan data warga jemaat
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {canEdit && (
          <RegionDialog editing={editing} open={open} setOpen={setOpen} />
        )}
      </div>
    </div>
  );
}
