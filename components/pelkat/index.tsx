"use client";

import { useMembers } from "@/hooks/use-member";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DataTablePelkatControls } from "./data-table-pelkat-control";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function PelkatMenu() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState({
    search: "",
    pelkat: "all",
  });
  const { data, isLoading } = useMembers({
    page,
    limit,
    pelkat: filter.pelkat,
    search: filter.search,
  });
  const members = data?.data ?? [];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
            Pelkat Members
          </h1>
          <p className="text-muted-foreground">
            Warga Jemaat grouped by their calculated pelkat category
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle>Pelkat Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTablePelkatControls
              search={filter.search}
              onSearchChange={(value) =>
                setFilter({ ...filter, search: value })
              }
              searchPlaceholder="Search members or Keluarga..."
              meta={data?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
              pelkat={filter.pelkat}
              onPelkatChange={(value) =>
                setFilter({ ...filter, pelkat: value })
              }
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nama</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Pelkat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center">
                        Loading pelkat data...
                      </TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center">
                        No pelkat records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.firstName} {member.lastName ?? ""}
                        </TableCell>
                        <TableCell>{member.family?.familyName ?? ""}</TableCell>
                        <TableCell>
                          {formatLabel(member.pelkat ?? "")}
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
