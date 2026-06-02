"use client";

import { useCreateFamily, useUpdateFamily } from "@/hooks/use-family";
import { useRegions } from "@/hooks/use-region";
import type { Family, FamilyForm } from "@/types/family";
import {
  genderOptions,
  memberRoleOptions,
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
} from "lucide-react";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
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

const emptyMember: MemberForm = {
  name: "",
  gender: "MALE",
  birthDate: "",
  phone: "",
  email: "",
  role: "CHILD",
  isActive: true,
  isDeceased: false,
  deathDate: "",
};

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
      regionId: "",
      members: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  useEffect(() => {
    reset({
      familyName: editing?.familyName ?? "",
      address: editing?.address ?? "",
      regionId: editing?.regionId ?? "",
      members: [],
    });
  }, [editing, open, reset]);

  async function onSubmit(values: FamilyForm) {
    try {
      const members = values.members
        .filter((member) => member.name && member.birthDate)
        .map((member) => ({
          ...member,
          phone: member.phone || "",
          email: member.email || "",
          deathDate: member.isDeceased ? member.deathDate : "",
        }));

      const payload = {
        ...values,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
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
                  required: "Family name is required",
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
                rules={{ required: "Sektor Pelayanan is required" }}
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
                Address
              </Label>
              <Input id="address" {...register("address")} />
            </div>
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
                    <p className="font-medium">{member.name}</p>
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
                  Add Warga Jemaat now or create them later from the member
                  page.
                </p>
              ) : (
                fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border p-3">
                    <div className="mb-3 flex items-center justify-between">
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
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder="Name"
                        {...register(`members.${index}.name` as const)}
                      />
                      <Input
                        type="date"
                        {...register(`members.${index}.birthDate` as const)}
                      />
                      <Controller
                        control={control}
                        name={`members.${index}.gender` as const}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
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
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
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
                      <Input
                        placeholder="Phone"
                        {...register(`members.${index}.phone` as const)}
                      />
                      <Input
                        type="email"
                        placeholder="Email"
                        {...register(`members.${index}.email` as const)}
                      />
                    </div>
                  </div>
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
