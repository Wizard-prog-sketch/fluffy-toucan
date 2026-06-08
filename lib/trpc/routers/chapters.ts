import { z } from "zod";
import { publicProcedure, router } from "../server";

export const chaptersRouter = router({
  byStory: publicProcedure
    .input(z.object({ storyId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.chapter.findMany({
        where: { storyId: input.storyId },
        orderBy: { chapterNumber: "asc" },
        select: {
          id: true, chapterNumber: true, title: true,
          status: true, wordCount: true, hookScore: true, hookType: true,
          updatedAt: true,
        },
      })
    ),

  byNumber: publicProcedure
    .input(z.object({ storyId: z.string(), chapterNumber: z.number().int() }))
    .query(({ ctx, input }) =>
      ctx.prisma.chapter.findUnique({
        where: { storyId_chapterNumber: input },
        include: { outline: { include: { arc: true } } },
      })
    ),

  save: publicProcedure
    .input(z.object({
      storyId: z.string(),
      chapterNumber: z.number().int(),
      title: z.string().default(""),
      content: z.string(),
      wordCount: z.number().int(),
      outlineId: z.string().nullable().optional(),
      status: z.string().default("draft"),
      hookType: z.string().default(""),
      hookScore: z.number().int().default(0),
      generationMeta: z.string().default("{}"),
    }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.chapter.upsert({
        where: { storyId_chapterNumber: { storyId: input.storyId, chapterNumber: input.chapterNumber } },
        create: input,
        update: input,
      })
    ),

  updateStatus: publicProcedure
    .input(z.object({ id: z.string(), status: z.string(), revisionNotes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const chapter = await ctx.prisma.chapter.update({
        where: { id: input.id },
        data: { status: input.status, revisionNotes: input.revisionNotes ?? "" },
      });
      // Record a writing session whenever a chapter is approved
      if (input.status === "approved") {
        await ctx.prisma.writingSession.create({
          data: {
            storyId: chapter.storyId,
            chaptersWritten: 1,
            wordsProduced: chapter.wordCount,
            sessionDate: new Date(),
          },
        });
      }
      return chapter;
    }),

  addConsistencyFlag: publicProcedure
    .input(z.object({
      id: z.string(),
      flag: z.object({ type: z.string(), description: z.string(), severity: z.string() }),
    }))
    .mutation(async ({ ctx, input }) => {
      const chapter = await ctx.prisma.chapter.findUniqueOrThrow({ where: { id: input.id } });
      const flags = JSON.parse(chapter.consistencyFlags || "[]");
      flags.push(input.flag);
      return ctx.prisma.chapter.update({
        where: { id: input.id },
        data: { consistencyFlags: JSON.stringify(flags) },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.chapter.delete({ where: { id: input.id } })
    ),
});
