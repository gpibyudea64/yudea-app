"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useStoredUser } from "@/lib/auth-session";
import { useStoredRoleAccessMap } from "@/lib/rbac-config";
import { hasRequiredRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { menuItems } from "@/nav/const";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) {
  const pathname = usePathname();
  const currentUser = useStoredUser();
  const roleAccessMap = useStoredRoleAccessMap();

  const filteredMenuItems = useMemo(
    () =>
      menuItems.filter((item) =>
        hasRequiredRole(currentUser?.role, roleAccessMap[item.href] ?? item.roles),
      ),
    [currentUser?.role, roleAccessMap],
  );

  const sidebarBody = (isMobile = false) => (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6",
        "overflow-y-auto",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,211,117,0.15),transparent_30%),linear-gradient(180deg,transparent,rgba(255,255,255,0.02))]" />

        <div className="relative mb-5 shrink-0 space-y-3 sm:mb-6 sm:space-y-4">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_18px_38px_-18px_rgba(233,194,96,0.72)] sm:h-12 sm:w-12">
            CS
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Church System</h2>
            <p className="text-sm leading-relaxed text-sidebar-foreground/65">
              Mission control for your ministry
            </p>
          </div>
        </div>

        <div className="relative mb-4 shrink-0 rounded-[1.25rem] border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm sm:mb-5 sm:p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-sidebar-foreground/45">
            Signed In
          </p>
          <p className="mt-2 truncate text-sm font-medium">
            {currentUser?.email ?? currentUser?.name ?? "Guest"}
          </p>
          <p className="mt-1 text-xs text-sidebar-foreground/60">
            {currentUser?.role ?? "Unknown role"}
          </p>
        </div>

        <Separator className="mb-4 bg-white/10 sm:mb-5" />

        <nav
          className={cn(
            "relative flex min-h-0 flex-col gap-1.5 pr-1 pb-4 sm:gap-2 sm:pb-5",
            isMobile ? "" : "flex-1",
          )}
        >
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onMobileOpenChange?.(false)}
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "h-11 w-full justify-start gap-3 rounded-xl px-3.5 text-sidebar-foreground transition-all sm:h-12 sm:rounded-2xl sm:px-4",
                    isActive
                      ? "bg-white text-slate-900 shadow-[0_18px_36px_-22px_rgba(255,255,255,0.95)]"
                      : "hover:bg-white/8 hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-current sm:rounded-xl",
                      isActive
                        ? "border-slate-200 bg-slate-100"
                        : "border-white/10 bg-white/5",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>

        {!isMobile && (
          <div className="relative mt-2 shrink-0">
            <Separator className="my-3 bg-white/10 sm:my-4" />
            <p className="text-xs text-sidebar-foreground/45">
              © {new Date().getFullYear()} Church System
            </p>
          </div>
        )}
      </div>
  );

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="h-[100dvh] max-h-[100dvh] overflow-hidden w-[min(86vw,20rem)] border-white/10 bg-sidebar p-0 text-sidebar-foreground lg:hidden [&>button]:right-3 [&>button]:top-3 [&>button]:text-white"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>
              Access dashboard navigation on smaller screens.
            </SheetDescription>
          </SheetHeader>
          {sidebarBody(true)}
        </SheetContent>
      </Sheet>

      <aside className="hidden h-screen w-72 shrink-0 border-r border-sidebar-border/60 bg-sidebar text-sidebar-foreground lg:flex lg:flex-col xl:w-80">
        {sidebarBody()}
      </aside>
    </>
  );
}
