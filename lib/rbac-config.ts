"use client";

import { useSyncExternalStore } from "react";
import {
  configToViewMap,
  defaultRoleAccessConfig,
  parseRoleAccessConfig,
  RoleAccessConfig,
  serializeRoleAccessConfig,
} from "@/lib/rbac";

const ROLE_ACCESS_STORAGE_KEY = "role_access_config";
const ROLE_ACCESS_COOKIE_KEY = "role_access_config";
const ROLE_ACCESS_EVENT = "role-access-config-updated";
let cachedRoleAccessRaw: string | null | undefined;
let cachedRoleAccessConfig: RoleAccessConfig = defaultRoleAccessConfig;

const setCookie = (name: string, value: string, maxAge = 60 * 60 * 24 * 30) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
};

export const getStoredRoleAccessConfig = (): RoleAccessConfig => {
  if (typeof window === "undefined") {
    return defaultRoleAccessConfig;
  }

  const rawConfig = localStorage.getItem(ROLE_ACCESS_STORAGE_KEY);
  if (rawConfig === cachedRoleAccessRaw) {
    return cachedRoleAccessConfig;
  }

  cachedRoleAccessRaw = rawConfig;
  cachedRoleAccessConfig = parseRoleAccessConfig(rawConfig);
  return cachedRoleAccessConfig;
};

/** View-only map for sidebar and legacy consumers */
export const getStoredRoleAccessMap = () =>
  configToViewMap(getStoredRoleAccessConfig());

export const persistRoleAccessConfig = (config: RoleAccessConfig) => {
  if (typeof window === "undefined") return;

  const serialized = serializeRoleAccessConfig(config);
  localStorage.setItem(ROLE_ACCESS_STORAGE_KEY, serialized);
  setCookie(ROLE_ACCESS_COOKIE_KEY, serialized);
  window.dispatchEvent(new CustomEvent(ROLE_ACCESS_EVENT));
};

export const resetStoredRoleAccessConfig = () => {
  persistRoleAccessConfig(defaultRoleAccessConfig);
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

export const useStoredRoleAccessConfig = () =>
  useSyncExternalStore(
    subscribeToRoleAccessConfig,
    getStoredRoleAccessConfig,
    () => defaultRoleAccessConfig,
  );

export const useStoredRoleAccessMap = () => {
  const config = useStoredRoleAccessConfig();
  return configToViewMap(config);
};
