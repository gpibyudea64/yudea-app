"use client";

import { usePageAccess } from "@/hooks/use-page-access";
import { useDeleteMember, useMembers } from "@/hooks/use-member";
import type { Member, MemberForm } from "@/types/member";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Edit,
  Heart,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import MemberDialog from "./member-dialog";
import { DataTableMemberControls } from "./data-table-member-control";
import { SortableHeader } from "../ui/sortable-header";
import { formatDate, formatLabel } from "@/lib/client-helper";
import { useUpdateMember } from "@/hooks/use-member";
import { toast } from "sonner";
import SplitFamilyDialog, {
  type SplitFamilyData,
} from "../family/split-family-dialog";

type MembersPageProps = {
  initialRegion?: string;
};

export default function MembersPage({ initialRegion }: MembersPageProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState({
    search: "",
    region: initialRegion ? initialRegion : "all",
    pelkat: "all",
  });

  const [sortBy, setSortBy] = useState("firstName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  function handleSort(next: string) {
    setSortBy(next);
    setSortOrder(next === sortBy ? (sortOrder === "asc" ? "desc" : "asc") : "asc");
    setPage(1);
  }

  const { canEdit } = usePageAccess("/dashboard/members");
  const { data, isLoading } = useMembers({
    page,
    limit,
    search: filter.search,
    pelkat: filter.pelkat,
    region: filter.region,
    sortBy,
    sortOrder,
  });
  const deleteMutation = useDeleteMember();
  const updateMutation = useUpdateMember();
  const members = data?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  // Status Hidup quick-edit dialog
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusMember, setStatusMember] = useState<Member | null>(null);
  const [statusValue, setStatusValue] = useState<"HIDUP" | "MENINGGAL">("HIDUP");
  const [tanggalMeninggal, setTanggalMeninggal] = useState("");

  function openStatusEdit(item: Member) {
    setStatusMember(item);
    setStatusValue(item.isDeceased ? "MENINGGAL" : "HIDUP");
    setTanggalMeninggal(
      item.deathDate
        ? new Date(item.deathDate).toISOString().slice(0, 10)
        : "",
    );
    setStatusOpen(true);
  }

  async function handleStatusSave() {
    if (!statusMember) return;
    try {
      await updateMutation.mutateAsync({
        id: statusMember.id,
        data: {
          isDeceased: statusValue === "MENINGGAL",
          deathDate: statusValue === "MENINGGAL" ? tanggalMeninggal : "",
        } as Partial<MemberForm>,
      });
      toast.success("Status hidup diperbarui");
      setStatusOpen(false);
    } catch {
      toast.error("Gagal memperbarui status hidup");
    }
  }

  // Split family dialog
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitData, setSplitData] = useState<SplitFamilyData | null>(null);

  function openSplitFamily(item: Member) {
    if (!item.family) return;
    const newHeadName = `${item.firstName} ${item.lastName ?? ""}`.trim();
    setSplitData({
      originalFamilyId: item.family.id,
      originalFamilyName: item.family.familyName,
      newHeadMemberId: item.id,
      newHeadName,
      allMembers: (item.family.members ?? []).map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        role: m.role,
      })),
      defaultAddress: item.family.address ?? "",
      defaultProvinsi: item.family.provinsi ?? "",
      defaultKotaKabupaten: item.family.kotaKabupaten ?? "",
      defaultKecamatan: item.family.kecamatan ?? "",
      defaultKelurahan: item.family.kelurahan ?? "",
      defaultRegionId: item.family.regionId ?? "",
    });
    setSplitOpen(true);
  }

  // Status Aktif quick-edit dialog
  const [aktifOpen, setAktifOpen] = useState(false);
  const [aktifMember, setAktifMember] = useState<Member | null>(null);
  const [aktifValue, setAktifValue] = useState<"AKTIF" | "TIDAK_AKTIF">("AKTIF");
  const [tanggalPindah, setTanggalPindah] = useState("");

  function openAktifEdit(item: Member) {
    setAktifMember(item);
    setAktifValue(item.isActive ? "AKTIF" : "TIDAK_AKTIF");
    setTanggalPindah(
      item.tanggalPindah
        ? new Date(item.tanggalPindah).toISOString().slice(0, 10)
        : "",
    );
    setAktifOpen(true);
  }

  async function handleAktifSave() {
    if (!aktifMember) return;
    try {
      await updateMutation.mutateAsync({
        id: aktifMember.id,
        data: {
          isActive: aktifValue === "AKTIF",
          tanggalPindah: aktifValue === "TIDAK_AKTIF" ? tanggalPindah : "",
        } as Partial<MemberForm>,
      });
      toast.success("Status diperbarui");
      setAktifOpen(false);
    } catch {
      toast.error("Gagal memperbarui status");
    }
  }

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: Member) {
    setEditing(item);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Delete this member?");
    if (!confirmed) return;
    deleteMutation.mutateAsync(id);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
              Member Management
            </h1>
            <p className="text-muted-foreground">
              Create and update church member records
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={openCreate}
              className="shadow-lg transition-all hover:shadow-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Member
            </Button>
          )}
        </div>

        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Member Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableMemberControls
              search={filter.search}
              onSearchChange={(value) =>
                setFilter({ ...filter, search: value })
              }
              region={filter.region}
              onRegionChange={(value) =>
                setFilter({ ...filter, region: value })
              }
              pelkat={filter.pelkat}
              onPelkatChange={(value) =>
                setFilter({ ...filter, pelkat: value })
              }
              searchPlaceholder="Search Warga Jemaat, Keluarga, email, or phone..."
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Nama Lengkap"
                        sortBy="firstName"
                        currentSortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Birth Date"
                        sortBy="birthDate"
                        currentSortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Role"
                        sortBy="role"
                        currentSortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Sektor"
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
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Status"
                        sortBy="isActive"
                        currentSortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <SortableHeader
                        label="Status Hidup"
                        sortBy="isDeceased"
                        currentSortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
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
                        colSpan={canEdit ? 8 : 7}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                          <p className="text-muted-foreground">
                            Loading member data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 8 : 7}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No member records found
                          </p>
                          {canEdit && (
                            <Button
                              variant="outline"
                              onClick={openCreate}
                              className="mt-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create First Member
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((item) => (
                      <TableRow
                        key={item.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {item.firstName} {item.lastName ?? ""}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(item.birthDate)}</TableCell>
                        <TableCell>{formatLabel(item.role)}</TableCell>
                        <TableCell>{item.family?.region?.name ?? ""}</TableCell>
                        <TableCell>{formatLabel(item.pelkat ?? "")}</TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => openAktifEdit(item)}
                            className="cursor-pointer"
                          >
                            <Badge
                              variant={
                                item.isActive ? "default" : "outline"
                              }
                              className="cursor-pointer transition-colors hover:opacity-80"
                            >
                              {item.isActive ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => openStatusEdit(item)}
                            className="cursor-pointer"
                          >
                            <Badge
                              variant={
                                item.isDeceased ? "destructive" : "secondary"
                              }
                              className="cursor-pointer transition-colors hover:opacity-80"
                            >
                              <Heart className="mr-1 h-3 w-3" />
                              {item.isDeceased ? "Meninggal" : "Hidup"}
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
                              {item.role !== "FAMILY_HEAD" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openSplitFamily(item)}
                                  className="transition-colors hover:bg-amber-600 hover:text-white"
                                  title="Jadi Kepala Keluarga"
                                >
                                  <Users className="mr-1 h-3 w-3" />
                                  KK
                                </Button>
                              )}
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
          <MemberDialog editing={editing} open={open} setOpen={setOpen} />
        )}

        <SplitFamilyDialog
          open={splitOpen}
          setOpen={setSplitOpen}
          data={splitData}
        />

        {/* ── Status Aktif Quick-Edit Dialog ── */}
        <Dialog open={aktifOpen} onOpenChange={setAktifOpen}>
          <DialogContent className="sm:max-w-sm fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Update Status
              </DialogTitle>
              <DialogDescription>
                {aktifMember?.firstName} {aktifMember?.lastName ?? ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={aktifValue}
                  onValueChange={(v) =>
                    setAktifValue(v as "AKTIF" | "TIDAK_AKTIF")
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
              {aktifValue === "TIDAK_AKTIF" && (
                <div className="space-y-2">
                  <Label htmlFor="tanggalPindah">Tanggal Pindah</Label>
                  <Input
                    id="tanggalPindah"
                    type="date"
                    value={tanggalPindah}
                    onChange={(e) => setTanggalPindah(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAktifOpen(false)}
              >
                Batal
              </Button>
              <Button type="button" onClick={handleAktifSave}>
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Status Hidup Quick-Edit Dialog ── */}
        <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
          <DialogContent className="sm:max-w-sm fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Update Status Hidup
              </DialogTitle>
              <DialogDescription>
                {statusMember?.firstName} {statusMember?.lastName ?? ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Status Hidup</Label>
                <Select
                  value={statusValue}
                  onValueChange={(v) =>
                    setStatusValue(v as "HIDUP" | "MENINGGAL")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIDUP">Hidup</SelectItem>
                    <SelectItem value="MENINGGAL">Meninggal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {statusValue === "MENINGGAL" && (
                <div className="space-y-2">
                  <Label htmlFor="deathDate">Tanggal Meninggal</Label>
                  <Input
                    id="deathDate"
                    type="date"
                    value={tanggalMeninggal}
                    onChange={(e) => setTanggalMeninggal(e.target.value)}
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
              <Button type="button" onClick={handleStatusSave}>
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
