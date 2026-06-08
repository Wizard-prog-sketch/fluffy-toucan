import path from "path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

function createPrismaClient() {
  const authToken = process.env.TURSO_AUTH_TOKEN;
  // In production use Turso; locally use the SQLite file
  const raw = authToken
    ? (process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db")
    : (process.env.DATABASE_URL ?? "file:./dev.db");

  let dbUrl = raw;
  if (raw.startsWith("file:./") || raw.startsWith("file:../")) {
    const rel = raw.replace(/^file:/, "");
    dbUrl = `file:${path.resolve(process.cwd(), rel)}`;
  }
  const adapter = new PrismaLibSql({ url: dbUrl, ...(authToken ? { authToken } : {}) });
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
