import { initTRPC } from "@trpc/server";
import { NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";

export async function createContext(req: NextRequest) {
  return { prisma, req };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
