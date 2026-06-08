import { z } from "zod";
import { publicProcedure, router } from "../server";

export const platformsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.prisma.platform.findMany({ orderBy: { name: "asc" } })
  ),
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.platform.findUniqueOrThrow({ where: { id: input.id } })
    ),
});
