"use client";

import { usePageAccess } from "@/hooks/use-page-access";
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
import { DataTableControls } from "../ui/data-table-controls";
import { usePresbyters } from "@/hooks/use-member";
import { DataTablePresbyterControls } from "./data-table-presbyter-control";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString();
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function PresbyterPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState({
    search: "",
    region: "all",
  });
  const { canEdit } = usePageAccess("/dashboard/presbytery");
  const { data, isLoading } = usePresbyters({
    page,
    limit,
    search: filter.search,
    region: filter.region,
  });
  const members = data?.data ?? [];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
              Presbyter Management
            </h1>
            <p className="text-muted-foreground">
              Create and update presbyter records
            </p>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Presbyter Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTablePresbyterControls
              search={filter.search}
              onSearchChange={(value) =>
                setFilter({ ...filter, search: value })
              }
              searchPlaceholder="Search Presbyters"
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
              region={filter.region}
              onRegionChange={(value) =>
                setFilter({ ...filter, region: value })
              }
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Family</TableHead>
                    <TableHead className="font-semibold">Birth Date</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 7 : 6}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                          <p className="text-muted-foreground">
                            Loading presbyter data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 7 : 6}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No presbyter records found
                          </p>
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
                        <TableCell>{item.family?.region?.name ?? ""}</TableCell>
                        <TableCell>{formatDate(item.birthDate)}</TableCell>
                        <TableCell>{formatLabel(item.role)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.isActive ? "default" : "outline"}
                          >
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
