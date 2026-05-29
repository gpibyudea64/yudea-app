"use client";

import { useDeleteFamily, useFamilies } from "@/hooks/use-family";
import type { Family } from "@/types/family";
import { Calendar, Edit, Home, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import FamilyDialog from "./family-dialog";
import { DataTableControls } from "../ui/data-table-controls";

export default function FamiliesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useFamilies(page, limit, search);
  const deleteMutation = useDeleteFamily();
  const families = data?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Family | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: Family) {
    setEditing(item);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Delete this family?");
    if (!confirmed) return;
    deleteMutation.mutateAsync(id);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
              Family Management
            </h1>
            <p className="text-muted-foreground">
              Track families, regions, and household members
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="shadow-lg transition-all hover:shadow-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Family
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Family Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableControls
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search families, regions, or addresses..."
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Family</TableHead>
                    <TableHead className="font-semibold">Region</TableHead>
                    <TableHead className="font-semibold">Address</TableHead>
                    <TableHead className="font-semibold">Members</TableHead>
                    <TableHead className="w-40 text-center font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                          <p className="text-muted-foreground">
                            Loading family data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : families.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Home className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No family records found
                          </p>
                          <Button
                            variant="outline"
                            onClick={openCreate}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Family
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    families.map((item) => (
                      <TableRow
                        key={item.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          {item.familyName}
                        </TableCell>
                        <TableCell>{item.region?.name ?? ""}</TableCell>
                        <TableCell>{item.address ?? ""}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {item.members?.length ?? 0}
                          </span>
                        </TableCell>
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <FamilyDialog editing={editing} open={open} setOpen={setOpen} />
      </div>
    </div>
  );
}
