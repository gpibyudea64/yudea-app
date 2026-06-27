"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRegions } from "@/hooks/use-region";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import PelkatSelect from "../ui/pelkat-select";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
} from "lucide-react";

type ReportRow = {
  familyName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  address: string;
  birthDate: string;
  regionName: string;
  pelkat: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ReportPage() {
  const [pelkat, setPelkat] = useState("all");
  const [region, setRegion] = useState("all");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: regionsData } = useRegions(1, 999);
  const regionOptions =
    regionsData?.data?.map((r) => ({ label: r.name, value: r.id })) ?? [];

  const { data, isLoading, error } = useQuery<{ data: ReportRow[] }>({
    queryKey: ["report", pelkat, region],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("pelkat", pelkat);
      params.set("region", region);
      return fetch(`/api/report?${params.toString()}`).then((r) => r.json());
    },
    staleTime: 30_000,
  });

  const reportData = data?.data ?? [];

  const totalCount = reportData.length;

  async function handleExportXLS() {
    if (!reportData.length) return;

    const XLSX = await import("xlsx");

    const worksheetData = reportData.map((row) => ({
      "Nama Keluarga": row.familyName,
      "Nama Jemaat": row.fullName,
      Alamat: row.address,
      "Tanggal Lahir": formatDate(row.birthDate),
      "Sektor Pelayanan": row.regionName,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Jemaat");

    // Auto-fit column widths
    const colWidths = Object.keys(worksheetData[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...worksheetData.map((row) => String(row[key as keyof typeof row]).length),
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
    link.download = `laporan-jemaat.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }



  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
              Laporan Warga Jemaat
            </h1>
            <p className="text-muted-foreground">
              Export data warga jemaat berdasarkan PELKAT dan Sektor Pelayanan
            </p>
          </div>
        </div>

        {/* Filters + Export Buttons — hidden when printing */}
        <Card className="shadow-xl print:hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Filter & Export
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    PELKAT
                  </label>
                  <PelkatSelect
                    pelkat={pelkat}
                    onPelkatChange={(value) => {
                      setPelkat(value);
                    }}
                    onPageChange={() => {}}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Sektor Pelayanan
                  </label>
                  <Select
                    value={region}
                    onValueChange={(value) => {
                      setRegion(value);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-56">
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

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleExportXLS}
                  disabled={reportData.length === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export XLS
                </Button>
                <Button
                  onClick={() => window.print()}
                  disabled={reportData.length === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Cetak PDF
                </Button>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              {isLoading ? (
                <span>Memuat data...</span>
              ) : (
                <span>
                  Menampilkan <strong>{totalCount}</strong> warga jemaat
                  {pelkat !== "all" && (
                    <>
                      {" "}dari PELKAT <strong>{pelkat.replaceAll("_", " ")}</strong>
                    </>
                  )}
                  {region !== "all" && (
                    <>
                      {" "}di Sektor <strong>
                        {regionOptions.find((r) => r.value === region)?.label ??
                          region}
                      </strong>
                    </>
                  )}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="shadow-xl print:shadow-none print:border-0" ref={printRef}>
          <CardHeader className="border-b print:bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Data Warga Jemaat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 print:bg-muted/30">
                    <TableHead className="font-semibold">No</TableHead>
                    <TableHead className="font-semibold">
                      Nama Keluarga
                    </TableHead>
                    <TableHead className="font-semibold">Nama Jemaat</TableHead>
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                          <p className="text-muted-foreground">
                            Memuat data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-destructive"
                      >
                        Gagal memuat data laporan.
                      </TableCell>
                    </TableRow>
                  ) : reportData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            Pilih filter untuk menampilkan data
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.map((row, index) => (
                      <TableRow
                        key={`${row.familyName}-${row.firstName}-${index}`}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.familyName}
                        </TableCell>
                        <TableCell>{row.fullName}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {row.address}
                        </TableCell>
                        <TableCell>{formatDate(row.birthDate)}</TableCell>
                        <TableCell>{row.regionName}</TableCell>
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
