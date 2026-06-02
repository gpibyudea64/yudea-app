"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSaveRoleAccessSettings } from "@/hooks/use-rbac-settings";
import {
  APP_ROLES,
  defaultRoleAccessConfig,
  getProtectedRouteItems,
  type AppRole,
  type RoleAccessConfig,
} from "@/lib/rbac";
import { persistRoleAccessConfig } from "@/lib/rbac-config";
import { menuItems } from "@/nav/const";
import { RotateCcw, Save, Shield } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PermissionKind = "view" | "edit";

function toggleRole(
  config: RoleAccessConfig,
  path: string,
  kind: PermissionKind,
  role: AppRole,
) {
  const entry = config[path] ?? { view: [], edit: [] };
  const list = [...entry[kind]];
  const index = list.indexOf(role);

  if (index >= 0) {
    list.splice(index, 1);
  } else {
    list.push(role);
  }

  if (kind === "view") {
    const editList = (config[path]?.edit ?? []).filter((r) => list.includes(r));
    return {
      ...config,
      [path]: { view: list, edit: editList },
    };
  }

  const viewList = config[path]?.view ?? [];
  const editList = list.filter((r) => viewList.includes(r));

  return {
    ...config,
    [path]: { view: viewList, edit: editList },
  };
}

export function RoleAccessMatrix({
  initialConfig,
}: {
  initialConfig: RoleAccessConfig;
}) {
  const [draft, setDraft] = useState<RoleAccessConfig>(initialConfig);
  const saveMutation = useSaveRoleAccessSettings();

  useEffect(() => {
    setDraft(initialConfig);
  }, [initialConfig]);

  const routes = useMemo(() => {
    const labels = Object.fromEntries(
      menuItems.map((item) => [item.href, item.title]),
    );

    return getProtectedRouteItems(draft).map((route) => ({
      path: route.path,
      label: labels[route.path] ?? route.path,
    }));
  }, [draft]);

  function isChecked(
    path: string,
    kind: PermissionKind,
    role: AppRole,
  ) {
    return draft[path]?.[kind]?.includes(role) ?? false;
  }

  async function handleSave() {
    try {
      const saved = await saveMutation.mutateAsync(draft);
      persistRoleAccessConfig(saved);
      setDraft(saved);
      toast.success("Role access settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  }

  function handleReset() {
    setDraft(defaultRoleAccessConfig);
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role-Based Page Access
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Control which roles can open each page (View) and change data
              (Edit). Edit is only available when View is enabled.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset defaults
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-44 font-semibold">Page</TableHead>
                {APP_ROLES.map((role) => (
                  <TableHead
                    key={role}
                    colSpan={2}
                    className="border-l text-center font-semibold"
                  >
                    {role}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow className="bg-muted/30 text-xs">
                <TableHead />
                {APP_ROLES.map((role) => (
                  <Fragment key={`${role}-headers`}>
                    <TableHead className="border-l text-center">View</TableHead>
                    <TableHead className="text-center">Edit</TableHead>
                  </Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.path}>
                  <TableCell>
                    <div className="font-medium">{route.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {route.path}
                    </div>
                  </TableCell>
                  {APP_ROLES.map((role) => {
                    const viewChecked = isChecked(route.path, "view", role);
                    const editChecked = isChecked(route.path, "edit", role);

                    return (
                      <Fragment key={`${route.path}-${role}`}>
                        <TableCell className="border-l text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-input"
                            checked={viewChecked}
                            onChange={() =>
                              setDraft((prev) =>
                                toggleRole(prev, route.path, "view", role),
                              )
                            }
                            aria-label={`${route.label} view for ${role}`}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-input"
                            checked={editChecked}
                            disabled={!viewChecked}
                            onChange={() =>
                              setDraft((prev) =>
                                toggleRole(prev, route.path, "edit", role),
                              )
                            }
                            aria-label={`${route.label} edit for ${role}`}
                          />
                        </TableCell>
                      </Fragment>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap gap-2 border-t px-4 py-3">
          <Badge variant="outline">View = can open the page</Badge>
          <Badge variant="outline">Edit = can create, update, or delete</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
