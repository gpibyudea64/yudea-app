"use client";

import { useDeleteMember, useMembers } from "@/hooks/use-member";
import type { Member } from "@/types/member";
import { Badge } from "../ui/badge";
import { Calendar, Edit, Plus, Trash2, User, Users } from "lucide-react";
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
import MemberDialog from "./member-dialog";
import { DataTableControls } from "../ui/data-table-controls";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString();
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useMembers(page, limit, search);
  const deleteMutation = useDeleteMember();
  const members = data?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: Member) {
    setEditing(item);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Delete this member?");
    if (!confirmed) return;
    deleteMutation.mutateAsync(id);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
              Member Management
            </h1>
            <p className="text-muted-foreground">
              Create and update church member records
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="shadow-lg transition-all hover:shadow-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Member
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Member Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableControls
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search members, families, email, or phone..."
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Family</TableHead>
                    <TableHead className="font-semibold">Birth Date</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Pelkat</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-40 text-center font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                          <p className="text-muted-foreground">
                            Loading member data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No member records found
                          </p>
                          <Button
                            variant="outline"
                            onClick={openCreate}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Member
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((item) => (
                      <TableRow
                        key={item.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {item.name}
                          </span>
                        </TableCell>
                        <TableCell>{item.family?.familyName ?? ""}</TableCell>
                        <TableCell>{formatDate(item.birthDate)}</TableCell>
                        <TableCell>{formatLabel(item.role)}</TableCell>
                        <TableCell>{formatLabel(item.pelkat ?? "")}</TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "default" : "outline"}>
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
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

        <MemberDialog editing={editing} open={open} setOpen={setOpen} />
      </div>
    </div>
  );
}
