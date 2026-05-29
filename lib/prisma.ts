import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Use a global variable to store the client instance and prevent duplication
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Function to create the Prisma client instance
const createPrismaClient = () => {
  // 1. Set up the PostgreSQL connection pool using your database URL
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // 2. Create the Prisma adapter using that pool
  const adapter = new PrismaPg(pool);
  // 3. Instantiate PrismaClient with the adapter
  return new PrismaClient({ adapter });
};

// This is the key: check if an instance already exists on the global object.
// If it does, use it. If not, create a new one.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// In non-production environments (like development), save the instance to the global object
// to prevent a new one from being created on every hot reload.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
