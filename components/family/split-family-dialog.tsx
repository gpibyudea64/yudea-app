"use client";

import { useState } from "react";
import { Button } from "../ui/button";
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
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRegions } from "@/hooks/use-region";
import { ChevronDown, ChevronUp, Home, Users } from "lucide-react";

export type SplitFamilyData = {
  originalFamilyId: string;
  originalFamilyName: string;
  newHeadMemberId: string;
  newHeadName: string;
  allMembers: Array<{ id: string; firstName: string; lastName: string | null; role: string }>;
  defaultAddress: string;
  defaultProvinsi: string;
  defaultKotaKabupaten: string;
  defaultKecamatan: string;
  defaultKelurahan: string;
  defaultRegionId: string;
};

type SplitFamilyDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: SplitFamilyData | null;
};

export default function SplitFamilyDialog({
  open,
  setOpen,
  data,
}: SplitFamilyDialogProps) {
  const queryClient = useQueryClient();
  const { data: regionsData } = useRegions(1, 999);
  const regionOptions =
    regionsData?.data?.map((r) => ({ label: r.name, value: r.id })) ?? [];

  const [familyName, setFamilyName] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [address, setAddress] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [kotaKabupaten, setKotaKabupaten] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [showDetailAlamat, setShowDetailAlamat] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Pre-fill from the original family when a new split target is provided.
  // This uses React's recommended "adjust state during render when props
  // change" pattern instead of an effect (avoids cascading re-renders).
  const [lastData, setLastData] = useState(data);
  if (data !== lastData) {
    setLastData(data);
    if (data && open) {
      setFamilyName(`${data.originalFamilyName} - ${data.newHeadName}`);
      setSelectedRegionId(data.defaultRegionId);
      setAddress(data.defaultAddress);
      setProvinsi(data.defaultProvinsi);
      setKotaKabupaten(data.defaultKotaKabupaten);
      setKecamatan(data.defaultKecamatan);
      setKelurahan(data.defaultKelurahan);
      // Pre-select ALL members by default
      setSelectedMemberIds(new Set(data.allMembers.map((m) => m.id)));
    }
  }

  if (!data) return null;
  const d = data;

  const otherMembers = d.allMembers.filter(
    (m) => m.id !== d.newHeadMemberId,
  );

  function toggleMember(id: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedMemberIds.size === d.allMembers.length) {
      // Deselect all except the head
      setSelectedMemberIds(new Set([d.newHeadMemberId]));
    } else {
      // Select all
      setSelectedMemberIds(new Set(d.allMembers.map((m) => m.id)));
    }
  }

  async function handleSubmit() {
    if (!familyName.trim()) {
      toast.error("Nama keluarga baru wajib diisi");
      return;
    }
    if (!selectedRegionId) {
      toast.error("Sektor Pelayanan wajib dipilih");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/family/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalFamilyId: d.originalFamilyId,
          newHeadMemberId: d.newHeadMemberId,
          movedMemberIds: Array.from(selectedMemberIds),
          familyName: familyName.trim(),
          address: address || "",
          provinsi: provinsi || "",
          kotaKabupaten: kotaKabupaten || "",
          kecamatan: kecamatan || "",
          kelurahan: kelurahan || "",
          regionId: selectedRegionId,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Keluarga baru berhasil dibuat");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["family"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["member"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["birthday-members"], refetchType: "all" });
    } catch {
      toast.error("Gagal membuat keluarga baru");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Jadikan {d.newHeadName} sebagai Kepala Keluarga
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a new family by moving selected members from{" "}
            {d.originalFamilyName} under {d.newHeadName} as its head.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Member info summary */}
          <div className="rounded-lg bg-muted/30 p-3 space-y-1">
            <p className="text-sm font-medium">
              {d.newHeadName}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (Kepala Keluarga Baru)
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Keluarga asal: {d.originalFamilyName} &middot; {d.allMembers.length} anggota
            </p>
          </div>

          {/* New Family Details — compact */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4" />
              Data Keluarga Baru
            </h3>
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label htmlFor="splitFamilyName">Nama Keluarga</Label>
                <Input
                  id="splitFamilyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Nama keluarga baru"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="splitRegion">Sektor Pelayanan</Label>
                <SelectRoot
                  value={selectedRegionId}
                  onValueChange={setSelectedRegionId}
                >
                  <SelectTrigger id="splitRegion" className="w-full">
                    <SelectValue placeholder="Pilih Sektor" />
                  </SelectTrigger>
                  <SelectContent>
                    {regionOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </div>

              {/* Main address field always visible */}
              <div className="space-y-1">
                <Label htmlFor="splitAddress">Alamat</Label>
                <Input
                  id="splitAddress"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Merdeka No. 123, RT 01/RW 02"
                />
              </div>

              {/* Toggle for detailed address fields */}
              <button
                type="button"
                onClick={() => setShowDetailAlamat(!showDetailAlamat)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showDetailAlamat ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {showDetailAlamat ? "Sembunyikan detail alamat" : "Tampilkan detail alamat (provinsi, kota, dll)"}
              </button>

              {showDetailAlamat && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="splitProvinsi">Provinsi</Label>
                    <Input
                      id="splitProvinsi"
                      value={provinsi}
                      onChange={(e) => setProvinsi(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="splitKota">Kota/Kab</Label>
                    <Input
                      id="splitKota"
                      value={kotaKabupaten}
                      onChange={(e) => setKotaKabupaten(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="splitKecamatan">Kecamatan</Label>
                    <Input
                      id="splitKecamatan"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="splitKelurahan">Kelurahan</Label>
                    <Input
                      id="splitKelurahan"
                      value={kelurahan}
                      onChange={(e) => setKelurahan(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Members to move — compact card list */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pindahkan Anggota
              </h3>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {selectedMemberIds.size === d.allMembers.length
                  ? "Hanya KK"
                  : `Pilih Semua (${d.allMembers.length})`}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedMemberIds.size} dari {d.allMembers.length} anggota akan dipindahkan
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-2 p-1.5 rounded bg-primary/5">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="accent-primary"
                />
                <span className="text-sm">
                  {d.newHeadName}
                  <span className="text-xs text-muted-foreground ml-1">
                    (Kepala Keluarga)
                  </span>
                </span>
              </div>
              {otherMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.has(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="accent-primary"
                  />
                  <span className="text-sm">
                    {member.firstName} {member.lastName ?? ""}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({member.role.replaceAll("_", " ")})
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Batal
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? "Menyimpan..." : "Buat Keluarga Baru"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
