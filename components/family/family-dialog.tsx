"use client";

import { useCreateFamily, useUpdateFamily } from "@/hooks/use-family";
import { useRegions } from "@/hooks/use-region";
import {
  useProvinces,
  useRegencies,
  useDistricts,
  useVillages,
} from "@/hooks/use-indonesia-region";
import type { Family, FamilyForm } from "@/types/family";
import {
  genderOptions,
  memberRoleOptions,
  baptisStatusOptions,
  sidiStatusOptions,
  perkawinanStatusOptions,
  jabatanOptions,
  type MemberForm,
} from "@/types/member";
import {
  Edit,
  Home,
  MapPin,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Building2,
  Church,
  Heart,
  Briefcase,
  FileText,
} from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useDialogForm } from "@/hooks/use-dialog-form";
import { Button } from "../ui/button";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";

const emptyMember: MemberForm = {
  firstName: "",
  lastName: "",
  birthCity: "",
  gender: "MALE",
  birthDate: "",
  phone: "",
  email: "",
  role: "CHILD",
  childNumber: 0,
  sameAddressAsFamily: true,
  memberAddress: "",
  memberProvinsi: "",
  memberKotaKabupaten: "",
  memberKecamatan: "",
  memberKelurahan: "",
  statusBaptis: "BELUM",
  lokasiBaptis: "",
  tanggalBaptis: "",
  statusSidi: "BELUM",
  lokasiSidi: "",
  tanggalSidi: "",
  statusPerkawinan: "BELUM_MENIKAH",
  lokasiPemberkatanGereja: "",
  tanggalPemberkatanGereja: "",
  lokasiPerkawinanSipil: "",
  tanggalPerkawinanSipil: "",
  jabatan: "",
  gerejaAsal: "",
  pendidikanTerakhir: "",
  pekerjaan: "",
  tahunDaftar: "",
  pengalamanGereja: "",
  pengalamanOrganisasi: "",
  keteranganLain: "",
  tanggalPindah: "",
  isActive: true,
  isDeceased: false,
  deathDate: "",
  familyId: "",
  isPresbyter: false,
};

/**
 * Cascade selects for Indonesian administrative regions.
 */
function IndonesiaRegionSelects({
  initialValues,
  onRegionReady,
}: {
  initialValues?: { provinsi?: string; kotaKabupaten?: string; kecamatan?: string; kelurahan?: string };
  onRegionReady: (getRegion: () => { provinsi: string; kotaKabupaten: string; kecamatan: string; kelurahan: string }) => void;
}) {
  const { data: provinces } = useProvinces();
  const [provinsiCode, setProvinsiCode] = useState("");
  const [kotaCode, setKotaCode] = useState("");
  const [kecamatanCode, setKecamatanCode] = useState("");
  const [kelurahanCode, setKelurahanCode] = useState("");

  const [synced, setSynced] = useState(false);
  if (!synced && provinces && initialValues?.provinsi) {
    const p = provinces.find((p: { name: string }) => p.name === initialValues.provinsi);
    if (p) setProvinsiCode(p.code);
    setSynced(true);
  }

  const { data: regencies } = useRegencies(provinsiCode || null);
  const { data: districts } = useDistricts(kotaCode || null);
  const { data: villages } = useVillages(kecamatanCode || null);

  if (!synced && regencies && initialValues?.kotaKabupaten) {
    const r = regencies.find((r: { name: string }) => r.name === initialValues.kotaKabupaten);
    if (r) setKotaCode(r.code);
  }
  if (!synced && districts && initialValues?.kecamatan) {
    const d = districts.find((d: { name: string }) => d.name === initialValues.kecamatan);
    if (d) setKecamatanCode(d.code);
  }
  if (!synced && villages && initialValues?.kelurahan) {
    const v = villages.find((v: { name: string }) => v.name === initialValues.kelurahan);
    if (v) setKelurahanCode(v.code);
  }

  const provinsiName = provinces?.find((p: { code: string }) => p.code === provinsiCode)?.name ?? "";
  const kotaName = regencies?.find((r: { code: string }) => r.code === kotaCode)?.name ?? "";
  const kecamatanName = districts?.find((d: { code: string }) => d.code === kecamatanCode)?.name ?? "";
  const kelurahanName = villages?.find((v: { code: string }) => v.code === kelurahanCode)?.name ?? "";

  onRegionReady(() => ({
    provinsi: provinsiName,
    kotaKabupaten: kotaName,
    kecamatan: kecamatanName,
    kelurahan: kelurahanName,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="provinsi" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Provinsi
        </Label>
        <Select
          value={provinsiCode}
          onValueChange={(code) => {
            setProvinsiCode(code);
            setKotaCode("");
            setKecamatanCode("");
            setKelurahanCode("");
          }}
        >
          <SelectTrigger id="provinsi" className="w-full">
            <SelectValue placeholder="Pilih Provinsi" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {provinces?.map((p: { code: string; name: string }) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="kotaKabupaten" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Kota/Kabupaten
        </Label>
        <Select
          value={kotaCode}
          onValueChange={(code) => {
            setKotaCode(code);
            setKecamatanCode("");
            setKelurahanCode("");
          }}
          disabled={!provinsiCode}
        >
          <SelectTrigger id="kotaKabupaten" className="w-full">
            <SelectValue
              placeholder={
                provinsiCode ? "Pilih Kota/Kabupaten" : "Pilih Provinsi dulu"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {regencies?.map((r: { code: string; name: string }) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="kecamatan" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Kecamatan
        </Label>
        <Select
          value={kecamatanCode}
          onValueChange={(code) => {
            setKecamatanCode(code);
            setKelurahanCode("");
          }}
          disabled={!kotaCode}
        >
          <SelectTrigger id="kecamatan" className="w-full">
            <SelectValue
              placeholder={
                kotaCode ? "Pilih Kecamatan" : "Pilih Kota/Kabupaten dulu"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {districts?.map((d: { code: string; name: string }) => (
                <SelectItem key={d.code} value={d.code}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="kelurahan" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Kelurahan
        </Label>
        <Select
          value={kelurahanCode}
          onValueChange={setKelurahanCode}
          disabled={!kecamatanCode}
        >
          <SelectTrigger id="kelurahan" className="w-full">
            <SelectValue
              placeholder={
                kecamatanCode ? "Pilih Kelurahan" : "Pilih Kecamatan dulu"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {villages?.map((v: { code: string; name: string }) => (
                <SelectItem key={v.code} value={v.code}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function FamilyDialog({
  editing,
  open,
  setOpen,
}: {
  editing: Family | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const createMutation = useCreateFamily();
  const updateMutation = useUpdateFamily();
  const { data: regionsData } = useRegions(1, 999);
  const regionOptions =
    regionsData?.data?.map((region) => ({
      label: region.name,
      value: region.id,
    })) ?? [];

  const getRegionRef = { current: (() => ({ provinsi: "", kotaKabupaten: "", kecamatan: "", kelurahan: "" })) };

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FamilyForm>({
    defaultValues: {
      familyName: "",
      address: "",
      provinsi: "",
      kotaKabupaten: "",
      kecamatan: "",
      kelurahan: "",
      regionId: "",
      members: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  useDialogForm(reset, {
    familyName: "",
    address: "",
    provinsi: "",
    kotaKabupaten: "",
    kecamatan: "",
    kelurahan: "",
    regionId: "",
    members: [],
  }, { editing, open });

  async function onSubmit(values: FamilyForm) {
    try {
      const region = getRegionRef.current();

      if (!region.provinsi) {
        toast.error("Provinsi harus dipilih");
        return;
      }
      if (!region.kotaKabupaten) {
        toast.error("Kota/Kabupaten harus dipilih");
        return;
      }
      if (!region.kecamatan) {
        toast.error("Kecamatan harus dipilih");
        return;
      }
      if (!region.kelurahan) {
        toast.error("Kelurahan harus dipilih");
        return;
      }

      const members = values.members
        .filter((member) => member.firstName && member.birthDate)
        .map((member) => ({
          ...member,
          phone: member.phone || "",
          email: member.email || "",
          deathDate: member.isDeceased ? member.deathDate : "",
          childNumber: member.role === "CHILD" ? member.childNumber : 0,
          memberAddress: member.sameAddressAsFamily ? "" : member.memberAddress,
          memberProvinsi: member.sameAddressAsFamily ? "" : member.memberProvinsi,
          memberKotaKabupaten: member.sameAddressAsFamily ? "" : member.memberKotaKabupaten,
          memberKecamatan: member.sameAddressAsFamily ? "" : member.memberKecamatan,
          memberKelurahan: member.sameAddressAsFamily ? "" : member.memberKelurahan,
          lokasiBaptis: member.statusBaptis === "SUDAH" ? member.lokasiBaptis : "",
          tanggalBaptis: member.statusBaptis === "SUDAH" ? member.tanggalBaptis : "",
          lokasiSidi: member.statusSidi === "SUDAH" ? member.lokasiSidi : "",
          tanggalSidi: member.statusSidi === "SUDAH" ? member.tanggalSidi : "",
          lokasiPemberkatanGereja: member.statusPerkawinan === "MENIKAH" ? member.lokasiPemberkatanGereja : "",
          tanggalPemberkatanGereja: member.statusPerkawinan === "MENIKAH" ? member.tanggalPemberkatanGereja : "",
          lokasiPerkawinanSipil: member.statusPerkawinan === "MENIKAH" ? member.lokasiPerkawinanSipil : "",
          tanggalPerkawinanSipil: member.statusPerkawinan === "MENIKAH" ? member.tanggalPerkawinanSipil : "",
        }));

      const payload = {
        ...values,
        provinsi: region.provinsi,
        kotaKabupaten: region.kotaKabupaten,
        kecamatan: region.kecamatan,
        kelurahan: region.kelurahan,
        address: values.address || "",
        members,
      };

      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      toast.success("Saved successfully");
      setOpen(false);
    } catch {
      toast.error("Unable to save family");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {editing ? (
              <>
                <Edit className="h-5 w-5" />
                Update Family
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Create Family
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="familyName" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Family name
              </Label>
              <Input
                id="familyName"
                {...register("familyName", {
                  required: "Nama keluarga wajib diisi",
                })}
              />
              {errors.familyName && (
                <p className="text-sm text-red-500">
                  {errors.familyName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="regionId" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Sektor Pelayanan
              </Label>
              <Controller
                control={control}
                name="regionId"
                rules={{ required: "Sektor Pelayanan wajib dipilih" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="regionId" className="w-full">
                      <SelectValue placeholder="Select Sektor Pelayanan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {regionOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.regionId && (
                <p className="text-sm text-red-500">
                  {errors.regionId.message}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address (detail)
              </Label>
              <Input
                id="address"
                {...register("address", {
                  required: "Alamat wajib diisi",
                })}
                placeholder="e.g. Jl. Merdeka No. 123, RT 01/RW 02"
              />
              {errors.address && (
                <p className="text-sm text-red-500">
                  {errors.address.message}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <Building2 className="h-4 w-4" />
              Wilayah Administratif
            </div>
            <IndonesiaRegionSelects
              key={open ? "open" : "closed"}
              initialValues={
                editing
                  ? {
                      provinsi: editing.provinsi ?? undefined,
                      kotaKabupaten: editing.kotaKabupaten ?? undefined,
                      kecamatan: editing.kecamatan ?? undefined,
                      kelurahan: editing.kelurahan ?? undefined,
                    }
                  : undefined
              }
              onRegionReady={(getRegion) => {
                getRegionRef.current = getRegion;
              }}
            />
          </div>

          {editing?.members?.length ? (
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <Users className="h-4 w-4" />
                Existing Warga Jemaat
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {editing.members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-md border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{member.firstName} {member.lastName ?? ""}</p>
                    <p className="text-muted-foreground">
                      {member.role.replaceAll("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 font-medium">
                <UserPlus className="h-4 w-4" />
                New Warga Jemaat
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(emptyMember)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>

            <div className="space-y-4">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add Warga Jemaat now or create them later from the member page.
                </p>
              ) : (
                fields.map((field, index) => (
                  <MemberFormBlock
                    key={field.id}
                    index={index}
                    control={control}
                    register={register}
                    remove={remove}
                  />
                ))
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editing ? (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** A single member form block within the family dialog "New Warga Jemaat" section. */
function MemberFormBlock({
  index,
  control,
  register,
  remove,
}: {
  index: number;
  control: any;
  register: any;
  remove: (index: number) => void;
}) {
  const selectedRole = useWatch({ control, name: `members.${index}.role` as const });
  const selectedBaptis = useWatch({ control, name: `members.${index}.statusBaptis` as const });
  const selectedSidi = useWatch({ control, name: `members.${index}.statusSidi` as const });
  const selectedPerkawinan = useWatch({ control, name: `members.${index}.statusPerkawinan` as const });

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Member {index + 1}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => remove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Data Diri */}
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          placeholder="Nama Depan"
          {...register(`members.${index}.firstName` as const)}
        />
        <Input
          placeholder="Nama Belakang"
          {...register(`members.${index}.lastName` as const)}
        />
        <Input
          placeholder="Kota Lahir"
          {...register(`members.${index}.birthCity` as const)}
        />
        <Input
          type="date"
          {...register(`members.${index}.birthDate` as const)}
        />
        <Input
          placeholder="Phone"
          {...register(`members.${index}.phone` as const)}
        />
        <Input
          type="email"
          placeholder="Email"
          {...register(`members.${index}.email` as const)}
        />
        <Controller
          control={control}
          name={`members.${index}.gender` as const}
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Controller
          control={control}
          name={`members.${index}.role` as const}
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {memberRoleOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {selectedRole === "CHILD" && (
          <Input
            type="number"
            min="1"
            placeholder="Anak ke-"
            {...register(`members.${index}.childNumber` as const, {
              valueAsNumber: true,
            })}
          />
        )}
      </div>

      {/* Baptis */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Church className="h-4 w-4" />
          Baptis
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Controller
            control={control}
            name={`members.${index}.statusBaptis` as const}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status Baptis" />
                </SelectTrigger>
                <SelectContent>
                  {baptisStatusOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {selectedBaptis === "SUDAH" && (
            <>
              <Input
                placeholder="Lokasi Baptis"
                {...register(`members.${index}.lokasiBaptis` as const)}
              />
              <Input
                type="date"
                placeholder="Tanggal Baptis"
                {...register(`members.${index}.tanggalBaptis` as const)}
              />
            </>
          )}
        </div>
      </div>

      {/* Sidi */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Church className="h-4 w-4" />
          Sidi
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Controller
            control={control}
            name={`members.${index}.statusSidi` as const}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status Sidi" />
                </SelectTrigger>
                <SelectContent>
                  {sidiStatusOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {selectedSidi === "SUDAH" && (
            <>
              <Input
                placeholder="Lokasi Sidi"
                {...register(`members.${index}.lokasiSidi` as const)}
              />
              <Input
                type="date"
                placeholder="Tanggal Sidi"
                {...register(`members.${index}.tanggalSidi` as const)}
              />
            </>
          )}
        </div>
      </div>

      {/* Perkawinan */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Heart className="h-4 w-4" />
          Perkawinan
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Controller
            control={control}
            name={`members.${index}.statusPerkawinan` as const}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status Perkawinan" />
                </SelectTrigger>
                <SelectContent>
                  {perkawinanStatusOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {selectedPerkawinan === "MENIKAH" && (
            <>
              <Input
                placeholder="Lokasi Pemberkatan Gereja"
                {...register(`members.${index}.lokasiPemberkatanGereja` as const)}
              />
              <Input
                type="date"
                placeholder="Tanggal Pemberkatan Gereja"
                {...register(`members.${index}.tanggalPemberkatanGereja` as const)}
              />
              <Input
                placeholder="Lokasi Perkawinan Sipil"
                {...register(`members.${index}.lokasiPerkawinanSipil` as const)}
              />
              <Input
                type="date"
                placeholder="Tanggal Perkawinan Sipil"
                {...register(`members.${index}.tanggalPerkawinanSipil` as const)}
              />
            </>
          )}
        </div>
      </div>

      {/* Jabatan */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4" />
          Jabatan
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Controller
            control={control}
            name={`members.${index}.jabatan` as const}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {jabatanOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4" />
          Informasi Lainnya
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Gereja Asal (Pindahan Dari)"
            {...register(`members.${index}.gerejaAsal` as const)}
          />
          <Input
            placeholder="Pendidikan Terakhir"
            {...register(`members.${index}.pendidikanTerakhir` as const)}
          />
          <Input
            placeholder="Pekerjaan"
            {...register(`members.${index}.pekerjaan` as const)}
          />
          <Input
            placeholder="Tahun Daftar di GPIB Yudea"
            {...register(`members.${index}.tahunDaftar` as const)}
          />
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs text-muted-foreground">Pengalaman Gereja</Label>
            <textarea
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[60px]"
              placeholder="Pengalaman Gereja"
              {...register(`members.${index}.pengalamanGereja` as const)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs text-muted-foreground">Pengalaman Organisasi</Label>
            <textarea
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[60px]"
              placeholder="Pengalaman Organisasi"
              {...register(`members.${index}.pengalamanOrganisasi` as const)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs text-muted-foreground">Keterangan Lain-Lain</Label>
            <textarea
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[60px]"
              placeholder="Keterangan Lain-Lain"
              {...register(`members.${index}.keteranganLain` as const)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
