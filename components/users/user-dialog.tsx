import { APP_ROLES } from "@/lib/rbac";
import type { UserForm, UserListItem } from "@/types/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, ShieldUser } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDialogForm } from "@/hooks/use-dialog-form";
import { userFormSchema, type UserFormValues } from "@/schemas/user.schema";
import { useCreateUser, useUpdateUser } from "@/hooks/use-user";
import { useRegions } from "@/hooks/use-region";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function UserDialog({
  editing,
  open,
  setOpen,
}: {
  editing: UserListItem | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "STAFF",
      regionId: "",
    },
  });

  const role = watch("role");
  const { data: regionsData } = useRegions(1, 999);

  useDialogForm(reset, {
    name: "",
    email: "",
    password: "",
    role: "STAFF" as UserFormValues["role"],
    regionId: "",
  }, { editing, open });

  async function onSubmit(values: UserFormValues) {
    try {
      const updatePayload: Partial<UserForm> = {
        name: values.name,
        email: values.email,
        role: values.role,
        regionId: values.role === "COORDINATOR" ? values.regionId : undefined,
      };

      if (editing) {
        if (values.password) {
          updatePayload.password = values.password;
        }
        await updateMutation.mutateAsync({
          id: editing.id,
          data: updatePayload,
        });
      } else {
        if (!values.password) {
          toast.error("Password is required for new users");
          return;
        }
        const createPayload: UserForm = {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          regionId: values.role === "COORDINATOR" ? values.regionId : undefined,
        };
        await createMutation.mutateAsync(createPayload);
      }

      toast.success(editing ? "User updated" : "User created");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-125 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {editing ? (
              <>
                <Edit className="h-5 w-5" />
                Update User
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Create User
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Name</Label>
              <Input id="userName" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <Input id="userEmail" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPassword">
                {editing ? "New password (optional)" : "Password"}
              </Label>
              <Input
                id="userPassword"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShieldUser className="h-4 w-4" />
                Role
              </Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setValue("role", value as UserFormValues["role"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {APP_ROLES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.message}</p>
              )}
            </div>

            {role === "COORDINATOR" && (
              <div className="space-y-2">
                <Label htmlFor="regionId">Sektor Pelayanan</Label>
                <Select
                  value={watch("regionId")}
                  onValueChange={(value) => setValue("regionId", value)}
                >
                  <SelectTrigger id="regionId">
                    <SelectValue placeholder="Select Sektor Pelayanan" />
                  </SelectTrigger>
                  <SelectContent>
                    {regionsData?.data.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.regionId && (
                  <p className="text-sm text-red-500">
                    {errors.regionId.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
