"use client";

import UserDialog from "@/components/users/user-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableControls } from "@/components/ui/data-table-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePageAccess } from "@/hooks/use-page-access";
import { useDeleteUser, useUsers } from "@/hooks/use-user";
import type { UserListItem } from "@/types/user";
import { Edit, Plus, ShieldUser, Trash2 } from "lucide-react";
import { useState } from "react";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const { canEdit } = usePageAccess("/dashboard/users");

  const { data, isLoading } = useUsers(page, limit, search);
  const deleteMutation = useDeleteUser();
  const users = data?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: UserListItem) {
    setEditing(item);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Delete this user?");
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
              User Management
            </h1>
            <p className="text-muted-foreground">
              Create accounts and assign application roles
            </p>
          </div>
          {canEdit && (
            <Button onClick={openCreate} className="shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>

        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ShieldUser className="h-5 w-5" />
              System Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableControls
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search users..."
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    {canEdit && (
                      <TableHead className="w-40 text-center font-semibold">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 4 : 3}
                        className="py-12 text-center"
                      >
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 4 : 3}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {item.name ?? "—"}
                        </TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.role}</Badge>
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(item)}
                              >
                                <Edit className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
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
          <UserDialog editing={editing} open={open} setOpen={setOpen} />
        )}
      </div>
    </div>
  );
}
