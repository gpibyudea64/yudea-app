import { Edit, GitBranch, Plus } from "lucide-react";
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
import { Branch } from "@/types/branch";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { useCreateBranch, useUpdateBranch } from "@/hooks/use-branch";
import { useDialogForm } from "@/hooks/use-dialog-form";
import { BranchForm } from "@/types/branch";
import { useForm } from "react-hook-form";

export default function BranchDialog({
  editing,
  open,
  setOpen,
}: {
  editing: Branch | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchForm>({
    defaultValues: {
      name: "",
    },
  });

  useDialogForm(reset, { name: "" }, { editing, open });

  async function onSubmit(values: BranchForm) {
    try {
      const payload = {
        ...values,
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
                Update Branch
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Create Branch Record
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="branchName"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <GitBranch className="h-4 w-4" />
                Name
              </Label>
              <Input
                id="branchName"
                type="text"
                {...register("name", { required: "Name is required" })}
                className="w-full"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
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
