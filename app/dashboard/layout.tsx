"use client";

import { useState } from "react";
import { RbacGuard } from "@/components/auth/rbac-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,86,0.15),transparent_26%),radial-gradient(circle_at_100%_8%,rgba(35,63,133,0.14),transparent_24%)]" />
      <Sidebar
        mobileOpen={isMobileSidebarOpen}
        onMobileOpenChange={setIsMobileSidebarOpen}
      />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main className="w-full min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 xl:p-8">
          <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col">
            <RbacGuard>{children}</RbacGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
