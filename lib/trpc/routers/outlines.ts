import { z } from "zod";
import { publicProcedure, router } from "../server";

const OutlineInput = z.object({
  storyId: z.string(),
  arcId: z.string().nullable().default(null),
  chapterNumber: z.number().int(),
  title: z.string().default(""),
  sceneSummary: z.string(),
  location: z.string().default(""),
  charactersPresent: z.string().default("[]"),
  emotionalBeat: z.string().default(""),
  revelations: z.string().default(""),
  withheld: z.string().default(""),
  arcAdvancement: z.string().default(""),
  hookType: z.string().default(""),
  hookDescription: z.string().default(""),
  wordCountTarget: z.number().int().default(1200),
  approved: z.boolean().default(false),
});

export const outlinesRouter = router({
  byStory: publicProcedure
    .input(z.object({ storyId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.chapterOutline.findMany({
        where: { storyId: input.storyId },
        orderBy: { chapterNumber: "asc" },
        include: { arc: true, chapter: { select: { status: true, wordCount: true } } },
      })
    ),

  byChapter: publicProcedure
    .input(z.object({ storyId: z.string(), chapterNumber: z.number().int() }))
    .query(({ ctx, input }) =>
      ctx.prisma.chapterOutline.findUnique({
        where: { storyId_chapterNumber: input },
        include: { arc: true },
      })
    ),

  upsert: publicProcedure
    .input(OutlineInput)
    .mutation(({ ctx, input }) =>
      ctx.prisma.chapterOutline.upsert({
        where: { storyId_chapterNumber: { storyId: input.storyId, chapterNumber: input.chapterNumber } },
        create: input,
        update: input,
      })
    ),

  approve: publicProcedure
    .input(z.object({ id: z.string(), approved: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.chapterOutline.update({
        where: { id: input.id },
        data: { approved: input.approved },
      })
    ),

  bulkCreate: publicProcedure
    .input(z.object({ outlines: z.array(OutlineInput) }))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      for (const o of input.outlines) {
        const r = await ctx.prisma.chapterOutline.upsert({
          where: { storyId_chapterNumber: { storyId: o.storyId, chapterNumber: o.chapterNumber } },
          create: o,
          update: o,
        });
        results.push(r);
      }
      return results;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.chapterOutline.delete({ where: { id: input.id } })
    ),
});
