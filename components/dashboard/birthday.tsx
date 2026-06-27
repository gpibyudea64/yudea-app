"use client";

import { useState, memo } from "react";
import { useBirthdayMembers } from "@/hooks/use-birthday";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startLabel = startDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
  const endLabel = endDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
  return `${startLabel} - ${endLabel}`;
}

// Dynamically import the export button to avoid loading xlsx on page mount
const ExportButton = memo(function ExportButton({
  members,
  selectedDate,
}: {
  members: { name: string; regionName: string; birthDate: string }[];
  selectedDate: string;
}) {
  function formatExcelDate(value: string) {
    return new Date(value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <Button
      onClick={async () => {
        if (!members.length) return;

        // Dynamically import xlsx only when user clicks export
        const XLSX = await import("xlsx");

        const worksheetData = members.map((member) => ({
          "Nama Lengkap": member.name,
          "Sektor Pelayanan": member.regionName,
          "Tanggal Lahir": formatExcelDate(member.birthDate),
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ulang Tahun");

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
        link.download = `ulang-tahun-${selectedDate}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      }}
      disabled={members.length === 0}
      variant="outline"
      size="sm"
    >
      Export ke Excel
    </Button>
  );
});

export default function BirthdayDashboard() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}`;
  });

  const { data, isLoading, error } = useBirthdayMembers(selectedDate);
  const members = data?.data ?? [];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="space-y-2">
          <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
            Dashboard Ulang Tahun
          </h1>
          <p className="text-muted-foreground">
            Menampilkan ulang tahun Warga Jemaat untuk periode Minggu sampai
            Sabtu.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {data?.meta && (
              <p className="text-sm text-muted-foreground">
                Periode: {formatRange(data.meta.start, data.meta.end)}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Pilih tanggal dalam minggu:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Daftar Ulang Tahun</CardTitle>
            <ExportButton members={members} selectedDate={selectedDate} />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">
                      Nama Lengkap
                    </TableHead>
                    <TableHead className="font-semibold">
                      Sektor Pelayanan
                    </TableHead>
                    <TableHead className="font-semibold">
                      Tanggal Lahir
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center">
                        Loading data ulang tahun...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-12 text-center text-destructive"
                      >
                        Gagal memuat data ulang tahun.
                      </TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-12 text-center text-muted-foreground"
                      >
                        Tidak ada ulang tahun di periode ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow
                        key={member.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <TableCell>{member.name}</TableCell>
                        <TableCell>{member.regionName}</TableCell>
                        <TableCell>{formatDate(member.birthDate)}</TableCell>
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
