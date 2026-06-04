export const APP_ROLES = ["ADMIN", "STAFF", "COORDINATOR", "MEMBER"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type SessionUser = {
  id?: string;
  email?: string;
  name?: string;
  memberId?: string;
  regionId?: string;
  role: string;
};

export type ProtectedRoute = {
  path: string;
  roles: string[];
  editRoles: string[];
};

export type RouteAccessEntry = {
  view: string[];
  edit: string[];
};

/** @deprecated Use RouteAccessConfig — kept for migration from array-only storage */
export type RoleAccessMap = Record<string, string[]>;

export type RoleAccessConfig = Record<string, RouteAccessEntry>;

export const normalizeAppRole = (role: string | null | undefined): string => {
  if (!role) return "";
  const upper = role.trim().toUpperCase();
  if ((APP_ROLES as readonly string[]).includes(upper)) return upper;
  if (role.toLowerCase() === "admin") return "ADMIN";
  return upper;
};

export const defaultProtectedRoutes: ProtectedRoute[] = [
  {
    path: "/dashboard",
    roles: ["ADMIN", "STAFF", "COORDINATOR"],
    editRoles: ["ADMIN", "STAFF"],
  },
  {
    path: "/dashboard/branches",
    roles: ["ADMIN", "STAFF"],
    editRoles: ["ADMIN", "STAFF"],
  },
  {
    path: "/dashboard/regions",
    roles: ["ADMIN", "STAFF", "COORDINATOR"],
    editRoles: ["ADMIN", "STAFF"],
  },
  {
    path: "/dashboard/birthday",
    roles: ["ADMIN", "STAFF", "COORDINATOR"],
    editRoles: ["ADMIN", "STAFF", "COORDINATOR"],
  },
  {
    path: "/dashboard/families",
    roles: ["ADMIN", "STAFF", "COORDINATOR"],
    editRoles: ["ADMIN", "STAFF", "COORDINATOR"],
  },
  {
    path: "/dashboard/members",
    roles: ["ADMIN", "STAFF", "COORDINATOR", "MEMBER"],
    editRoles: ["ADMIN", "STAFF", "COORDINATOR"],
  },
  {
    path: "/dashboard/pelkat-members",
    roles: ["ADMIN", "STAFF"],
    editRoles: ["ADMIN", "STAFF"],
  },
  {
    path: "/dashboard/attendance",
    roles: ["ADMIN", "STAFF"],
    editRoles: ["ADMIN", "STAFF"],
  },
  {
    path: "/dashboard/users",
    roles: ["ADMIN"],
    editRoles: ["ADMIN"],
  },
  {
    path: "/dashboard/settings",
    roles: ["ADMIN"],
    editRoles: ["ADMIN"],
  },
];

export const protectedRoutes = defaultProtectedRoutes;

export const defaultRoleAccessConfig: RoleAccessConfig = Object.fromEntries(
  defaultProtectedRoutes.map((route) => [
    route.path,
    { view: route.roles, edit: route.editRoles },
  ]),
);

/** View-only map derived from config (sidebar / legacy helpers) */
export const defaultRoleAccessMap: RoleAccessMap = Object.fromEntries(
  defaultProtectedRoutes.map((route) => [route.path, route.roles]),
);

const protectedAdminOnlyRoutes = ["/dashboard/settings"];

export const resolveRoleAccessConfig = (
  overrides?: Partial<RoleAccessConfig>,
): RoleAccessConfig => {
  const merged = { ...defaultRoleAccessConfig } as RoleAccessConfig;

  Object.entries(overrides ?? {}).forEach(([path, entry]) => {
    if (entry) {
      merged[path] = {
        view: entry.view ?? merged[path]?.view ?? [],
        edit: entry.edit ?? merged[path]?.edit ?? [],
      };
    }
  });

  protectedAdminOnlyRoutes.forEach((path) => {
    merged[path] = { view: ["ADMIN"], edit: ["ADMIN"] };
  });

  return merged;
};

export const configToViewMap = (config: RoleAccessConfig): RoleAccessMap =>
  Object.fromEntries(
    Object.entries(config).map(([path, entry]) => [path, entry.view]),
  );

export const serializeRoleAccessConfig = (config: RoleAccessConfig) =>
  JSON.stringify(resolveRoleAccessConfig(config));

export const parseRoleAccessConfig = (
  rawConfig?: string | null,
): RoleAccessConfig => {
  if (!rawConfig) {
    return resolveRoleAccessConfig();
  }

  try {
    const parsed = JSON.parse(rawConfig) as Record<
      string,
      RouteAccessEntry | string[]
    >;
    const overrides: Partial<RoleAccessConfig> = {};

    Object.entries(parsed).forEach(([path, value]) => {
      if (Array.isArray(value)) {
        overrides[path] = { view: value, edit: [] };
      } else if (value && typeof value === "object") {
        overrides[path] = {
          view: value.view ?? [],
          edit: value.edit ?? [],
        };
      }
    });

    return resolveRoleAccessConfig(overrides);
  } catch {
    return resolveRoleAccessConfig();
  }
};

export const serializeRoleAccessMap = (config: RoleAccessMap) =>
  serializeRoleAccessConfig(
    Object.fromEntries(
      Object.entries(config).map(([path, roles]) => [
        path,
        {
          view: roles,
          edit: roles.filter((r) => r === "ADMIN" || r === "STAFF"),
        },
      ]),
    ),
  );

export const parseRoleAccessMap = (rawConfig?: string | null): RoleAccessMap =>
  configToViewMap(parseRoleAccessConfig(rawConfig));

export const hasRequiredRole = (
  role: string | null | undefined,
  allowedRoles?: string[],
) => {
  if (!allowedRoles?.length) return true;
  const normalized = normalizeAppRole(role);
  if (!normalized) return false;
  return allowedRoles.includes(normalized);
};

export const getRouteAccessForPath = (
  pathname: string,
  config: RoleAccessConfig = resolveRoleAccessConfig(),
): RouteAccessEntry | undefined => {
  const resolvedRoutes = getProtectedRouteItems(config);

  const match = resolvedRoutes
    .filter(
      (route) =>
        pathname === route.path || pathname.startsWith(`${route.path}/`),
    )
    .sort((current, next) => next.path.length - current.path.length)[0];

  if (!match) return undefined;

  return (
    config[match.path] ?? {
      view: match.roles,
      edit: match.editRoles,
    }
  );
};

export const getAllowedRolesForPathFromConfig = (
  pathname: string,
  config: RoleAccessConfig,
) => getRouteAccessForPath(pathname, config)?.view;

export const getAllowedRolesForPath = (pathname: string) =>
  getRouteAccessForPath(pathname)?.view;

export const getEditRolesForPath = (
  pathname: string,
  config: RoleAccessConfig = resolveRoleAccessConfig(),
) => getRouteAccessForPath(pathname, config)?.edit;

export const getProtectedRouteItems = (roleAccessConfig?: RoleAccessConfig) => {
  const resolved = resolveRoleAccessConfig(roleAccessConfig);

  return protectedRoutes.map((route) => ({
    ...route,
    roles: resolved[route.path]?.view ?? route.roles,
    editRoles: resolved[route.path]?.edit ?? route.editRoles,
  }));
};

export const getDefaultDashboardPath = (role?: string | null) => {
  const normalized = normalizeAppRole(role);

  if (normalized === "MEMBER") {
    return "/dashboard/members";
  }

  if (normalized === "COORDINATOR") {
    return "/dashboard/families";
  }

  return "/dashboard";
};

export const canViewPath = (
  role: string | null | undefined,
  pathname: string,
  config?: RoleAccessConfig,
) => hasRequiredRole(role, getRouteAccessForPath(pathname, config)?.view);

export const canEditPath = (
  role: string | null | undefined,
  pathname: string,
  config?: RoleAccessConfig,
) => hasRequiredRole(role, getRouteAccessForPath(pathname, config)?.edit);
