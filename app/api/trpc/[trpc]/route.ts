import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";
import { appRouter } from "@/lib/trpc/routers/_app";
import { createContext } from "@/lib/trpc/server";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: ({ path, error }) => {
      if (process.env.NODE_ENV === "development") {
        console.error(`tRPC error on ${path ?? "<no-path>"}:`, error);
      }
    },
  });

export { handler as GET, handler as POST };
