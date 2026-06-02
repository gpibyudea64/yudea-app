"use client";

import { useMemberPerRegions } from "@/hooks/use-region";
import { Calendar, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export default function RegionStat() {
  const { data, isLoading } = useMemberPerRegions();
  const regionMemberCounts = data?.data ?? [];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Sektor Pelayanan Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Warga Jemaat in every Sektor Pelayanan
        </h2>
      </div>

      <Card className="shadow-xl">
        {" "}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">
                    Sektor Pelayanan
                  </TableHead>
                  <TableHead className="font-semibold">Warga Jemaat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                        <p className="text-muted-foreground">
                          Loading family data...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : regionMemberCounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Home className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          No Region records found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  regionMemberCounts.map((item) => (
                    <TableRow
                      key={item.regionId}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {item.regionName}
                      </TableCell>
                      <TableCell>{item.memberCount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
