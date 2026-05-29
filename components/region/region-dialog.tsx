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
import { Branch } from "@/app/generated/prisma/client";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
} from "@/hooks/use-branch";
import { BranchForm } from "@/types/branch";
import { Region, RegionForm } from "@/types/region";
import { useCreateRegion, useUpdateRegion } from "@/hooks/use-region";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function RegionDialog({
  form,
  editing,
  open,
  setOpen,
  setForm,
}: {
  form: RegionForm;
  editing: Region | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setForm: Dispatch<SetStateAction<RegionForm>>;
}) {
  const createMutation = useCreateRegion();
  const updateMutation = useUpdateRegion();

  const { data } = useBranches(1, 999);

  const branchOptions = data?.data?.map((branch) => ({
    label: branch.name,
    value: branch.id,
  }));

  console.log(data);
  async function handleSubmit() {
    try {
      const payload = {
        ...form,
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
                Update Region
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Create Region Record
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
                <GitBranch className="h-4 w-4" />
                Name
              </Label>
              <Input
                id="serviceDate"
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="serviceDate"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <GitBranch className="h-4 w-4" />
                Branch
              </Label>
              <Select
                value={form.branchId}
                onValueChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    branchId: e,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {branchOptions?.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
