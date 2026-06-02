"use client";

import { usePageAccess } from "@/hooks/use-page-access";
import { useDeleteRegion, useRegions } from "@/hooks/use-region";
import { Region } from "@/types/region";
import { useState } from "react";
import { Button } from "../ui/button";
import { Calendar, Church, Edit, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import RegionDialog from "./region-dialog";
import { DataTableControls } from "../ui/data-table-controls";

export default function Regions() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { canEdit } = usePageAccess("/dashboard/regions");
  const { data, isLoading } = useRegions(page, limit, search);
  const deleteMutation = useDeleteRegion();

  const regions = data?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: Region) {
    setEditing(item);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Delete this Sektor Pelayanan?");
    if (!confirmed) return;
    deleteMutation.mutateAsync(id);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Sektor Pelayanan Management
            </h1>
            <p className="text-muted-foreground">
              Track and manage church branch
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={openCreate}
              className="shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Sektor Pelayanan
            </Button>
          )}
        </div>

        {/* Table Section */}
        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sektor Pelayanan Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableControls
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search Sektor Pelayanan or Wilayah Pelayanan..."
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Branch</TableHead>
                    {canEdit && (
                      <TableHead className="font-semibold text-center w-40">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 3 : 2}
                        className="text-center py-12"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-muted-foreground">
                            Loading regions data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : regions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 3 : 2}
                        className="text-center py-12"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Church className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No regions records found
                          </p>
                          {canEdit && (
                            <Button
                              variant="outline"
                              onClick={openCreate}
                              className="mt-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create First Record
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    regions.map((item: Region) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>

                        <TableCell className="font-medium">
                          {item.branch?.name ?? ""}
                        </TableCell>

                        {canEdit && (
                          <TableCell>
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(item)}
                                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                                className="hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {canEdit && (
          <RegionDialog editing={editing} open={open} setOpen={setOpen} />
        )}
      </div>
    </div>
  );
}
