import { Calendar, Church, Edit, Plus, UserCheck, UserX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  useCreateAttendance,
  useUpdateAttendance,
} from "@/hooks/use-attendance";
import { Attendance } from "@/app/generated/prisma/client";
import { AttendanceForm } from "@/types/attendance";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";

export default function AttendanceDialog({
  editing,
  open,
  setOpen,
}: {
  editing: Attendance | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AttendanceForm>({
    defaultValues: {
      serviceDate: "",
      serviceType: "",
      maleCount: 0,
      femaleCount: 0,
    },
  });

  const [maleCount, femaleCount] = useWatch({
    control,
    name: ["maleCount", "femaleCount"],
  });

  useEffect(() => {
    if (!editing) {
      reset({
        serviceDate: "",
        serviceType: "",
        maleCount: 0,
        femaleCount: 0,
      });
      return;
    }

    const date = new Date(editing.serviceDate);

    reset({
      serviceDate: date.toISOString().slice(0, 16),
      serviceType: editing.serviceType,
      maleCount: editing.maleCount,
      femaleCount: editing.femaleCount,
    });
  }, [editing, open, reset]);

  async function onSubmit(values: AttendanceForm) {
    try {
      const payload = {
        ...values,
        totalCount: Number(values.maleCount) + Number(values.femaleCount),
      };

      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      toast.success("Successfull");

      setOpen(false);
    } catch {
      toast.error("Error");
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
                Update Attendance
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Create Attendance Record
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="serviceDate"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Calendar className="h-4 w-4" />
                Service Date & Time
              </Label>
              <Input
                id="serviceDate"
                type="datetime-local"
                {...register("serviceDate", {
                  required: "Service date is required",
                })}
                className="w-full"
              />
              {errors.serviceDate && (
                <p className="text-sm text-red-500">
                  {errors.serviceDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="serviceType"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Church className="h-4 w-4" />
                Service Type
              </Label>
              <Input
                id="serviceType"
                type="text"
                {...register("serviceType", {
                  required: "Service type is required",
                })}
                placeholder="e.g., Sunday Service"
                className="w-full"
              />
              {errors.serviceType && (
                <p className="text-sm text-red-500">
                  {errors.serviceType.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="maleCount"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  Male Count
                </Label>
                <Input
                  id="maleCount"
                  type="number"
                  {...register("maleCount", {
                    valueAsNumber: true,
                    required: "Male count is required",
                    min: {
                      value: 0,
                      message: "Male count cannot be negative",
                    },
                  })}
                  min="0"
                  className="w-full"
                />
                {errors.maleCount && (
                  <p className="text-sm text-red-500">
                    {errors.maleCount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="femaleCount"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <UserX className="h-4 w-4 text-pink-500" />
                  Female Count
                </Label>
                <Input
                  id="femaleCount"
                  type="number"
                  {...register("femaleCount", {
                    valueAsNumber: true,
                    required: "Female count is required",
                    min: {
                      value: 0,
                      message: "Female count cannot be negative",
                    },
                  })}
                  min="0"
                  className="w-full"
                />
                {errors.femaleCount && (
                  <p className="text-sm text-red-500">
                    {errors.femaleCount.message}
                  </p>
                )}
              </div>
            </div>

            {/* Preview Total */}
            <div className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Total Attendance:
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Number(maleCount) + Number(femaleCount)}
                </span>
              </div>
            </div>
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
