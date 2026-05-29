"use client";

import { useSyncExternalStore } from "react";
import {
  defaultRoleAccessMap,
  parseRoleAccessMap,
  RoleAccessMap,
  serializeRoleAccessMap,
} from "@/lib/rbac";

const ROLE_ACCESS_STORAGE_KEY = "role_access_config";
const ROLE_ACCESS_COOKIE_KEY = "role_access_config";
const ROLE_ACCESS_EVENT = "role-access-config-updated";
let cachedRoleAccessRaw: string | null | undefined;
let cachedRoleAccessMap: RoleAccessMap = defaultRoleAccessMap;

const setCookie = (name: string, value: string, maxAge = 60 * 60 * 24 * 30) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
};

export const getStoredRoleAccessMap = (): RoleAccessMap => {
  if (typeof window === "undefined") {
    return defaultRoleAccessMap;
  }

  const rawConfig = localStorage.getItem(ROLE_ACCESS_STORAGE_KEY);
  if (rawConfig === cachedRoleAccessRaw) {
    return cachedRoleAccessMap;
  }

  cachedRoleAccessRaw = rawConfig;
  cachedRoleAccessMap = parseRoleAccessMap(rawConfig);
  return cachedRoleAccessMap;
};

export const persistRoleAccessMap = (config: RoleAccessMap) => {
  if (typeof window === "undefined") return;

  const serialized = serializeRoleAccessMap(config);
  localStorage.setItem(ROLE_ACCESS_STORAGE_KEY, serialized);
  setCookie(ROLE_ACCESS_COOKIE_KEY, serialized);
  window.dispatchEvent(new CustomEvent(ROLE_ACCESS_EVENT));
};

export const resetStoredRoleAccessMap = () => {
  persistRoleAccessMap(defaultRoleAccessMap);
};

export const roleAccessConfigEvent = ROLE_ACCESS_EVENT;

const subscribeToRoleAccessConfig = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(ROLE_ACCESS_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(ROLE_ACCESS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

export const useStoredRoleAccessMap = () =>
  useSyncExternalStore(
    subscribeToRoleAccessConfig,
    getStoredRoleAccessMap,
    () => defaultRoleAccessMap,
  );
