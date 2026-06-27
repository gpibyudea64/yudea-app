"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  TrendingUp,
  Church,
  UserCheck,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageAccess } from "@/hooks/use-page-access";
import { useAttendances, useDeleteAttendance } from "@/hooks/use-attendance";
import AttendanceDialog from "./attendance-dialog";
import AttendanceCard from "./attendance-card";
import { getServiceTypeColor } from "@/lib/client-helper";
import { DataTableControls } from "../ui/data-table-controls";
import { Attendance } from "@prisma/client";

export default function AttendancePage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { canEdit } = usePageAccess("/dashboard/attendance");
  const { data: attendanceResult, isLoading } = useAttendances(
    page,
    limit,
    search,
  );
  const deleteMutation = useDeleteAttendance();

  const attendances = attendanceResult?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Attendance | null>(null);

  // Memoize statistics calculations to avoid recomputation on every render
  const stats = useMemo(() => {
    const totalAttendances = attendances.reduce(
      (sum, item) => sum + item.totalCount,
      0,
    );
    const totalMales = attendances.reduce((sum, item) => sum + item.maleCount, 0);
    const totalFemales = attendances.reduce(
      (sum, item) => sum + item.femaleCount,
      0,
    );
    const averageAttendance =
      attendances.length > 0
        ? Math.round(totalAttendances / attendances.length)
        : 0;

    return { totalAttendances, totalMales, totalFemales, averageAttendance };
  }, [attendances]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: Attendance) {
    setEditing(item);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Delete this attendance?");
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
              Attendance Management
            </h1>
            <p className="text-muted-foreground">
              Track and manage church service attendance
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={openCreate}
              className="shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Attendance
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AttendanceCard
            cardTitle="Total Attendances"
            contentNumber={stats.totalAttendances}
            contentText="All time attendance"
            titleIcon={<Users className="h-4 w-4 opacity-80" />}
            backgroundClass="bg-linear-to-br from-blue-500 to-blue-600"
          />

          <AttendanceCard
            cardTitle="Average Attendance"
            contentNumber={stats.averageAttendance}
            contentText="Per service"
            titleIcon={<TrendingUp className="h-4 w-4 opacity-80" />}
            backgroundClass="bg-linear-to-br from-emerald-500 to-emerald-600"
          />

          <AttendanceCard
            cardTitle="Male Attendance"
            contentNumber={stats.totalMales}
            contentText={`${
              stats.totalAttendances > 0
                ? Math.round((stats.totalMales / stats.totalAttendances) * 100)
                : 0
            } % of total`}
            titleIcon={<UserCheck className="h-4 w-4 opacity-80" />}
            backgroundClass="bg-linear-to-br from-purple-500 to-purple-600"
          />

          <AttendanceCard
            cardTitle="Female Attendance"
            contentNumber={stats.totalFemales}
            contentText={`${
              stats.totalAttendances > 0
                ? Math.round((stats.totalFemales / stats.totalAttendances) * 100)
                : 0
            }
                % of total`}
            titleIcon={<UserX className="h-4 w-4 opacity-80" />}
            backgroundClass="bg-linear-to-br from-pink-500 to-pink-600"
          />
        </div>

        {/* Table Section */}
        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableControls
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search service type..."
              meta={attendanceResult?.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">
                      Service Type
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Male
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Female
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Total
                    </TableHead>
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
                        colSpan={canEdit ? 6 : 5}
                        className="text-center py-12"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-muted-foreground">
                            Loading attendance data...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : attendances.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 6 : 5}
                        className="text-center py-12"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Church className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No attendance records found
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
                    attendances.map((item: Attendance) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(item.serviceDate), "dd MMM yyyy")}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.serviceDate), "HH:mm")}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={getServiceTypeColor(item.serviceType)}
                          >
                            {item.serviceType}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-blue-500" />
                            {item.maleCount}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1">
                            <UserX className="h-3 w-3 text-pink-500" />
                            {item.femaleCount}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <Users className="h-3 w-3" />
                            {item.totalCount}
                          </span>
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
          <AttendanceDialog editing={editing} open={open} setOpen={setOpen} />
        )}
      </div>
    </div>
  );
}
