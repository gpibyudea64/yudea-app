import type { NextAuthConfig } from "next-auth";

const authConfig = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/public/login",
  },
  providers: [],
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;

export default authConfig;
