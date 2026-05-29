"use client";

import { useFamilies } from "@/hooks/use-family";
import { useCreateMember, useUpdateMember } from "@/hooks/use-member";
import {
  genderOptions,
  memberRoleOptions,
  type Member,
  type MemberForm,
} from "@/types/member";
import { Edit, Mail, Phone, Plus, User, Users } from "lucide-react";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function MemberDialog({
  editing,
  open,
  setOpen,
}: {
  editing: Member | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const createMutation = useCreateMember();
  const updateMutation = useUpdateMember();
  const { data: familiesData } = useFamilies(1, 999);
  const familyOptions =
    familiesData?.data?.map((family) => ({
      label: family.familyName,
      value: family.id,
    })) ?? [];

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberForm>({
    defaultValues: {
      name: "",
      gender: "MALE",
      birthDate: "",
      phone: "",
      email: "",
      role: "CHILD",
      isActive: true,
      isDeceased: false,
      deathDate: "",
      familyId: "",
    },
  });

  useEffect(() => {
    reset({
      name: editing?.name ?? "",
      gender: editing?.gender ?? "MALE",
      birthDate: toDateInput(editing?.birthDate),
      phone: editing?.phone ?? "",
      email: editing?.email ?? "",
      role: editing?.role ?? "CHILD",
      isActive: editing?.isActive ?? true,
      isDeceased: editing?.isDeceased ?? false,
      deathDate: toDateInput(editing?.deathDate),
      familyId: editing?.familyId ?? "",
    });
  }, [editing, open, reset]);

  async function onSubmit(values: MemberForm) {
    try {
      const payload = {
        ...values,
        phone: values.phone || "",
        email: values.email || "",
        deathDate: values.isDeceased ? values.deathDate : "",
      };

      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      toast.success("Saved successfully");
      setOpen(false);
    } catch {
      toast.error("Unable to save member");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {editing ? (
              <>
                <Edit className="h-5 w-5" />
                Update Member
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Create Member
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="memberName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
              </Label>
              <Input
                id="memberName"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="familyId" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Family
              </Label>
              <Controller
                control={control}
                name="familyId"
                rules={{ required: "Family is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="familyId" className="w-full">
                      <SelectValue placeholder="Select family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {familyOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.familyId && (
                <p className="text-sm text-red-500">
                  {errors.familyId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth date</Label>
              <Input
                id="birthDate"
                type="date"
                {...register("birthDate", {
                  required: "Birth date is required",
                })}
              />
              {errors.birthDate && (
                <p className="text-sm text-red-500">
                  {errors.birthDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Select
                    value={field.value ? "true" : "false"}
                    onValueChange={(value) => field.onChange(value === "true")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input id="phone" {...register("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input id="email" type="email" {...register("email")} />
            </div>

            <div className="space-y-2">
              <Label>Life status</Label>
              <Controller
                control={control}
                name="isDeceased"
                render={({ field }) => (
                  <Select
                    value={field.value ? "true" : "false"}
                    onValueChange={(value) => field.onChange(value === "true")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Life status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Living</SelectItem>
                      <SelectItem value="true">Deceased</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deathDate">Death date</Label>
              <Input id="deathDate" type="date" {...register("deathDate")} />
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
