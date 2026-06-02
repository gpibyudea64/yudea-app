import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { normalizeAppRole } from "@/lib/rbac";
import { prisma } from "./lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("AUTH Credentials", credentials);
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        console.log("user found", !!user);

        if (!user || !user.password) {
          console.log("user/password missing");
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        console.log("password valid", isValid);

        if (!isValid) {
          console.log("Invalid password");
          return null;
        }
        console.log("login success", user.email);

        return {
          ...user,
          role: normalizeAppRole(user.role),
          regionId: user.regionId ?? undefined,
        } as any;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = normalizeAppRole(user.role as string);
        token.regionId = (user as any).regionId ?? undefined;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = normalizeAppRole(token.role as string);
      session.user.regionId = token.regionId as string | undefined;
      return session;
    },
  },
});
