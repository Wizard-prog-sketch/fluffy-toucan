import { z } from "zod";
import { publicProcedure, router } from "../server";

const ArcInput = z.object({
  storyId: z.string(),
  order: z.number().int(),
  name: z.string().min(1),
  summary: z.string(),
  emotionalArc: z.string().default(""),
  startChapter: z.number().int(),
  endChapter: z.number().int(),
});

export const arcsRouter = router({
  byStory: publicProcedure
    .input(z.object({ storyId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.arc.findMany({
        where: { storyId: input.storyId },
        orderBy: { order: "asc" },
        include: { _count: { select: { chapterOutlines: true } } },
      })
    ),

  create: publicProcedure
    .input(ArcInput)
    .mutation(({ ctx, input }) => ctx.prisma.arc.create({ data: input })),

  update: publicProcedure
    .input(z.object({ id: z.string(), data: ArcInput.partial() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.arc.update({ where: { id: input.id }, data: input.data })
    ),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.arc.delete({ where: { id: input.id } })
    ),

  upsertMany: publicProcedure
    .input(z.object({ storyId: z.string(), arcs: z.array(ArcInput) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.arc.deleteMany({ where: { storyId: input.storyId } });
      return ctx.prisma.arc.createMany({ data: input.arcs });
    }),
});
