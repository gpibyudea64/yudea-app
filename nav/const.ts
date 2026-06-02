import { AppRole } from "@/lib/rbac";
import {
  CalendarCheck,
  Cake,
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
    title: "Ulang Tahun",
    href: "/dashboard/birthday",
    icon: Cake,
    roles: ["ADMIN", "STAFF", "COORDINATOR"] satisfies AppRole[],
  },
  {
    title: "Wilayah Pelayanan",
    href: "/dashboard/branches",
    icon: Church,
    roles: ["ADMIN", "STAFF"] satisfies AppRole[],
  },
  {
    title: "Sektor Pelayanan",
    href: "/dashboard/regions",
    icon: Compass,
    roles: ["ADMIN", "STAFF", "COORDINATOR"] satisfies AppRole[],
  },
  {
    title: "Keluarga",
    href: "/dashboard/families",
    icon: HeartHandshake,
    roles: ["ADMIN", "STAFF", "COORDINATOR"] satisfies AppRole[],
  },
  {
    title: "Warga Jemaat",
    href: "/dashboard/members",
    icon: Users,
    roles: ["ADMIN", "STAFF", "COORDINATOR", "MEMBER"] satisfies AppRole[],
  },
  {
    title: "Majelis Jemaat",
    href: "/dashboard/presbytery",
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
