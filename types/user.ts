import type { AppRole } from "@/lib/rbac";

export type AppUser = {
  id: string;
  name: string | null;
  email: string;
  role: AppRole | string;
  regionId?: string | null;
};

export type UserForm = {
  name: string;
  email: string;
  password?: string;
  role: string;
  regionId?: string;
};

export type UserListItem = Omit<AppUser, "password">;
