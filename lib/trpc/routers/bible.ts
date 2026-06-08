import { z } from "zod";
import { publicProcedure, router } from "../server";

export const bibleRouter = router({
  byStory: publicProcedure
    .input(z.object({ storyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [bible, characters, plotThreads, worldElements, hookLog] = await Promise.all([
        ctx.prisma.storyBible.findUnique({ where: { storyId: input.storyId } }),
        ctx.prisma.character.findMany({
          where: { storyId: input.storyId },
          include: { relationshipsOut: { include: { toChar: true } } },
          orderBy: { role: "asc" },
        }),
        ctx.prisma.plotThread.findMany({
          where: { storyId: input.storyId },
          orderBy: { openedChapter: "asc" },
        }),
        ctx.prisma.worldElement.findMany({ where: { storyId: input.storyId } }),
        ctx.prisma.hookLog.findMany({
          where: { storyId: input.storyId },
          orderBy: { chapterNumber: "desc" },
          take: 20,
        }),
      ]);
      return { bible, characters, plotThreads, worldElements, hookLog };
    }),

  upsertBible: publicProcedure
    .input(z.object({ storyId: z.string(), summary: z.string(), lastUpdatedChapter: z.number().int() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.storyBible.upsert({
        where: { storyId: input.storyId },
        create: input,
        update: { summary: input.summary, lastUpdatedChapter: input.lastUpdatedChapter },
      })
    ),

  upsertCharacter: publicProcedure
    .input(z.object({
      id: z.string().optional(),
      storyId: z.string(),
      name: z.string(),
      role: z.string().default("supporting"),
      physicalDesc: z.string().default(""),
      speechPatterns: z.string().default(""),
      mannerisms: z.string().default(""),
      backstory: z.string().default(""),
      wounds: z.string().default(""),
      currentArc: z.string().default(""),
      introducedChapter: z.number().int().default(1),
      lastSeenChapter: z.number().int().default(1),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) return ctx.prisma.character.update({ where: { id }, data });
      return ctx.prisma.character.create({ data });
    }),

  deleteCharacter: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.character.delete({ where: { id: input.id } })
    ),

  upsertPlotThread: publicProcedure
    .input(z.object({
      id: z.string().optional(),
      storyId: z.string(),
      title: z.string(),
      description: z.string(),
      openedChapter: z.number().int(),
      resolvedChapter: z.number().int().nullable().default(null),
      status: z.string().default("open"),
      lastMentionedChapter: z.number().int().default(0),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) return ctx.prisma.plotThread.update({ where: { id }, data });
      return ctx.prisma.plotThread.create({ data });
    }),

  upsertWorldElement: publicProcedure
    .input(z.object({
      id: z.string().optional(),
      storyId: z.string(),
      category: z.string().default("location"),
      name: z.string(),
      description: z.string(),
      firstMentionedChapter: z.number().int().default(1),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) return ctx.prisma.worldElement.update({ where: { id }, data });
      return ctx.prisma.worldElement.create({ data });
    }),

  logHook: publicProcedure
    .input(z.object({
      storyId: z.string(),
      chapterNumber: z.number().int(),
      hookType: z.string(),
      hookSummary: z.string().default(""),
    }))
    .mutation(({ ctx, input }) => ctx.prisma.hookLog.create({ data: input })),
});
