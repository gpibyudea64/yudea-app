import type { NextAuthConfig } from "next-auth";

const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/public/login",
  },
  providers: [],
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;

export default authConfig;
