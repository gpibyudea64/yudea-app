import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      regionId?: string;
    } & DefaultSession["user"];
  }
  interface User {
    role: string; // 👈 add this
    regionId?: string;
  }
}
