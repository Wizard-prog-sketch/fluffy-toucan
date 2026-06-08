import { z } from "zod";
import { publicProcedure, router } from "../server";

export const translationRouter = router({
  // List all translations for a story, grouped by language
  byStory: publicProcedure
    .input(z.object({ storyId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.chapterTranslation.findMany({
        where: { storyId: input.storyId },
        orderBy: [{ targetLanguage: "asc" }, { chapterNumber: "asc" }],
        select: {
          id: true,
          chapterNumber: true,
          sourceLanguage: true,
          targetLanguage: true,
          wordCount: true,
          updatedAt: true,
        },
      })
    ),

  // Get a specific chapter's translation in a given language
  byChapter: publicProcedure
    .input(z.object({ storyId: z.string(), chapterNumber: z.number().int(), targetLanguage: z.string() }))
    .query(async ({ ctx, input }) => {
      const chapter = await ctx.prisma.chapter.findUnique({
        where: { storyId_chapterNumber: { storyId: input.storyId, chapterNumber: input.chapterNumber } },
        select: { id: true },
      });
      if (!chapter) return null;
      return ctx.prisma.chapterTranslation.findUnique({
        where: { chapterId_targetLanguage: { chapterId: chapter.id, targetLanguage: input.targetLanguage } },
      });
    }),

  // Which chapters have been translated to a given language
  translatedChapters: publicProcedure
    .input(z.object({ storyId: z.string(), targetLanguage: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.chapterTranslation.findMany({
        where: { storyId: input.storyId, targetLanguage: input.targetLanguage },
        orderBy: { chapterNumber: "asc" },
        select: { chapterNumber: true, wordCount: true, updatedAt: true },
      })
    ),

  // Delete a specific translation
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.chapterTranslation.delete({ where: { id: input.id } })
    ),

  // Delete all translations of a given language for a story
  deleteLanguage: publicProcedure
    .input(z.object({ storyId: z.string(), targetLanguage: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.chapterTranslation.deleteMany({
        where: { storyId: input.storyId, targetLanguage: input.targetLanguage },
      })
    ),
});
