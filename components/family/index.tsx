"use client";

import { usePageAccess } from "@/hooks/use-page-access";
import { useDeleteFamily, useFamilies } from "@/hooks/use-family";
import { useQueryClient } from "@tanstack/react-query";
import type { Family } from "@/types/family";
import { Badge } from "../ui/badge";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  Edit,
  Home,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import SplitFamilyDialog, {
  type SplitFamilyData,
} from "./split-family-dialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import FamilyDialog from "./family-dialog";
import { DataTableControls } from "../ui/data-table-controls";
import { toast } from "sonner";

export default function FamiliesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("familyName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { canEdit } = usePageAccess("/dashboard/families");
  const { data, isLoading } = useFamilies(page, limit, search, sortBy, sortOrder);
  const deleteMutation = useDeleteFamily();
  const queryClient = useQueryClient();
  const families = data?.data ?? [];

  // Split family dialog
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitData, setSplitData] = useState<SplitFamilyData | null>(null);

  function openSplitFamily(item: Family) {
    const headMember = item.members?.find((m) => m.role === "FAMILY_HEAD");
    if (!headMember) {
      toast.error("Tidak ada Kepala Keluarga untuk dipisah");
      return;
    }
    const newHeadName = `${headMember.firstName} ${headMember.lastName ?? ""}`.trim();
    setSplitData({
      originalFamilyId: item.id,
      originalFamilyName: item.familyName,
      newHeadMemberId: headMember.id,
      newHeadName,
      allMembers: (item.members ?? []).map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        role: m.role,
      })),
      defaultAddress: item.address ?? "",
      defaultProvinsi: item.provinsi ?? "",
      defaultKotaKabupaten: item.kotaKabupaten ?? "",
      defaultKecamatan: item.kecamatan ?? "",
      defaultKelurahan: item.kelurahan ?? "",
      defaultRegionId: item.regionId ?? "",
    });
    setSplitOpen(true);
  }

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Family | null>(null);

  // Status cascade quick-edit dialog
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusFamily, setStatusFamily] = useState<Family | null>(null);
  const [statusAktifValue, setStatusAktifValue] = useState<"AKTIF" | "TIDAK_AKTIF">("AKTIF");
  const [statusTanggalPindah, setStatusTanggalPindah] = useState("");

  function openFamilyStatusEdit(item: Family) {
    setStatusFamily(item);
    // Determine family status from members
    const allActive = item.members?.every((m) => m.isActive) ?? true;
    setStatusAktifValue(allActive ? "AKTIF" : "TIDAK_AKTIF");
    // Pick the first member's tanggalPindah as representative
    const firstPindah = item.members?.find((m) => m.tanggalPindah)?.tanggalPindah;
    setStatusTanggalPindah(
      firstPindah
        ? new Date(firstPindah).toISOString().slice(0, 10)
        : "",
    );
    setStatusOpen(true);
  }

  async function handleFamilyStatusSave() {
    if (!statusFamily) return;
    try {
      const res = await fetch(`/api/family/${statusFamily.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: statusAktifValue === "AKTIF",
          tanggalPindah: statusAktifValue === "TIDAK_AKTIF" ? statusTanggalPindah : "",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status keluarga diperbarui untuk semua anggota");
      setStatusOpen(false);
      queryClient.invalidateQueries({ queryKey: ["family"] });
    } catch {
      toast.error("Gagal memperbarui status keluarga");
    }
  }

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: Family) {
    setEditing(item);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Delete this family?");
    if (!confirmed) return;
    deleteMutation.mutateAsync(id);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
              Family Management
            </h1>
            <p className="text-muted-foreground">
              Track Keluarga, Sektor Pelayanan, and household members
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={openCreate}
              className="shadow-lg transition-all hover:shadow-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Family
            </Button>
          )}
        </div>

        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Family Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableControls
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari Nama Keluarga atau Sektor Pelayanan..."
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                        onClick={() => {
                          setSortBy("familyName");
                          setSortOrder(
                            sortBy === "familyName"
                              ? sortOrder === "asc" ? "desc" : "asc"
                              : "asc",
                          );
                          setPage(1);
                        }}
                      >
                        Family
                        {sortBy === "familyName" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                        onClick={() => {
                          setSortBy("regionName");
                          setSortOrder(
                            sortBy === "regionName"
                              ? sortOrder === "asc" ? "desc" : "asc"
                              : "asc",
                          );
                          setPage(1);
                        }}
                      >
                        Sektor Pelayanan
                        {sortBy === "regionName" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      Kota/Kab
                    </TableHead>
                    <TableHead className="font-semibold">Kecamatan</TableHead>
                    <TableHead className="font-semibold">Kelurahan</TableHead>
                    <TableHead className="font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                        onClick={() => {
                          setSortBy("address");
                          setSortOrder(
                            sortBy === "address"
                              ? sortOrder === "asc" ? "desc" : "asc"
                              : "asc",
                          );
                          setPage(1);
                        }}
                      >
                        Detail Alamat
                        {sortBy === "address" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      Warga Jemaat
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    {canEdit && (
                      <TableHead className="w-40 text-center font-semibold">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 9 : 8}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                          <p className="text-muted-foreground">
                            Loading family data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : families.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 9 : 8}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Home className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No family records found
                          </p>
                          {canEdit && (
                            <Button
                              variant="outline"
                              onClick={openCreate}
                              className="mt-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create First Family
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    families.map((item) => (
                      <TableRow
                        key={item.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          {item.familyName}
                        </TableCell>
                        <TableCell>{item.region?.name ?? ""}</TableCell>
                        <TableCell>{item.kotaKabupaten ?? ""}</TableCell>
                        <TableCell>{item.kecamatan ?? ""}</TableCell>
                        <TableCell>{item.kelurahan ?? ""}</TableCell>
                        <TableCell>{item.address ?? ""}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {item.members?.length ?? 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => openFamilyStatusEdit(item)}
                            className="cursor-pointer"
                          >
                            <Badge
                              variant={
                                item.members?.some((m) => !m.isActive)
                                  ? "outline"
                                  : "default"
                              }
                              className="cursor-pointer transition-colors hover:opacity-80"
                            >
                              {item.members?.some((m) => !m.isActive)
                                ? "Tidak Aktif"
                                : "Aktif"}
                            </Badge>
                          </button>
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(item)}
                                className="transition-colors hover:bg-primary hover:text-primary-foreground"
                              >
                                <Edit className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openSplitFamily(item)}
                                className="transition-colors hover:bg-amber-600 hover:text-white"
                                title="Pisah Keluarga"
                              >
                                <Users className="mr-1 h-3 w-3" />
                                Pisah
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                                className="transition-colors hover:bg-red-600"
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
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

        {canEdit && (
          <FamilyDialog editing={editing} open={open} setOpen={setOpen} />
        )}

        <SplitFamilyDialog
          open={splitOpen}
          setOpen={setSplitOpen}
          data={splitData}
        />

        {/* ── Status Keluarga Cascade Dialog ── */}
        <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
          <DialogContent className="sm:max-w-sm fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Update Status Keluarga
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                {statusFamily?.familyName} — {statusFamily?.members?.length ?? 0} anggota
              </p>
              <p className="text-xs text-muted-foreground">
                Perubahan status akan diterapkan ke semua anggota keluarga.
              </p>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusAktifValue}
                  onValueChange={(v) =>
                    setStatusAktifValue(v as "AKTIF" | "TIDAK_AKTIF")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {statusAktifValue === "TIDAK_AKTIF" && (
                <div className="space-y-2">
                  <Label htmlFor="famTanggalPindah">Tanggal Pindah</Label>
                  <Input
                    id="famTanggalPindah"
                    type="date"
                    value={statusTanggalPindah}
                    onChange={(e) => setStatusTanggalPindah(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusOpen(false)}
              >
                Batal
              </Button>
              <Button type="button" onClick={handleFamilyStatusSave}>
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
