"use client";

import { RoleAccessMatrix } from "@/components/settings/role-access-matrix";
import { useRoleAccessSettings } from "@/hooks/use-rbac-settings";
import { defaultRoleAccessConfig } from "@/lib/rbac";
import { persistRoleAccessConfig } from "@/lib/rbac-config";
import { Settings } from "lucide-react";
import { useEffect } from "react";

export default function SettingsPage() {
  const { data, isLoading, isError } = useRoleAccessSettings();

  useEffect(() => {
    if (data) {
      persistRoleAccessConfig(data);
    }
  }, [data]);

  const config = data ?? defaultRoleAccessConfig;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
            <Settings className="h-8 w-8 text-slate-700 dark:text-slate-300" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure role-based access for dashboard pages
          </p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading access settings...</p>
        ) : isError ? (
          <p className="text-destructive">
            Could not load settings. Ensure you are signed in as an admin.
          </p>
        ) : (
          <RoleAccessMatrix initialConfig={config} />
        )}
      </div>
    </div>
  );
}
