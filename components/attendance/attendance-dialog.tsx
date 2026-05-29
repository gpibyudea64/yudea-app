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
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

export default function AttendanceDialog({
  form,
  editing,
  open,
  setOpen,
  setForm,
}: {
  form: AttendanceForm;
  editing: Attendance | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setForm: Dispatch<SetStateAction<AttendanceForm>>;
}) {
  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();
  async function handleSubmit() {
    try {
      const payload = {
        ...form,
        totalCount: Number(form.maleCount) + Number(form.femaleCount),
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
    } catch (e) {
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
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
                value={form.serviceDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    serviceDate: e.target.value,
                  })
                }
                className="w-full"
                required
              />
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
                value={form.serviceType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    serviceType: e.target.value,
                  })
                }
                placeholder="e.g., Sunday Service"
                className="w-full"
                required
              />
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
                  value={form.maleCount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maleCount: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  className="w-full"
                  required
                />
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
                  value={form.femaleCount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      femaleCount: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  className="w-full"
                  required
                />
              </div>
            </div>

            {/* Preview Total */}
            <div className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Total Attendance:
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Number(form.maleCount) + Number(form.femaleCount)}
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
            <Button type="submit">
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
