import { AppRole } from "@/lib/rbac";
import {
  CalendarCheck,
  Church,
  Compass,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  ShieldUser,
  Users,
} from "lucide-react";

export const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "STAFF", "COORDINATOR"] satisfies AppRole[],
  },
  {
    title: "Branches",
    href: "/dashboard/branches",
    icon: Church,
    roles: ["ADMIN", "STAFF"] satisfies AppRole[],
  },
  {
    title: "Regions",
    href: "/dashboard/regions",
    icon: Compass,
    roles: ["ADMIN", "STAFF", "COORDINATOR"] satisfies AppRole[],
  },
  {
    title: "Families",
    href: "/dashboard/families",
    icon: HeartHandshake,
    roles: ["ADMIN", "STAFF", "COORDINATOR"] satisfies AppRole[],
  },
  {
    title: "Members",
    href: "/dashboard/members",
    icon: Users,
    roles: ["ADMIN", "STAFF", "COORDINATOR", "MEMBER"] satisfies AppRole[],
  },
  {
    title: "Pelkat Members",
    href: "/dashboard/pelkat-members",
    icon: Users,
    roles: ["ADMIN", "STAFF"] satisfies AppRole[],
  },
  {
    title: "Attendance",
    href: "/dashboard/attendance",
    icon: CalendarCheck,
    roles: ["ADMIN", "STAFF"] satisfies AppRole[],
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: ShieldUser,
    roles: ["ADMIN"] satisfies AppRole[],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["ADMIN"] satisfies AppRole[],
  },
];
