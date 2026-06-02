"use client";

import { SessionProvider } from "next-auth/react";
import { SessionSync } from "./session-sync";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync />
      {children}
    </SessionProvider>
  );
}
