import { z } from "zod";
import { publicProcedure, router } from "../server";

const StoryCreateInput = z.object({
  title: z.string().min(1),
  genre: z.string().min(1),
  subGenre: z.string().default(""),
  platformId: z.string().min(1),
  writerMode: z.enum(["typeA", "typeB"]).default("typeA"),
  targetChapters: z.number().int().min(50).default(200),
  synopsis: z.string().default(""),
  submissionPackage: z.string().default(""),
  existingOutline: z.string().default(""),
  existingChapters: z.string().default(""),
});

function parseExistingChapters(text: string): Array<{ chapterNumber: number; content: string; wordCount: number }> {
  const lines = text.split("\n");
  const chapters: Array<{ chapterNumber: number; content: string; wordCount: number }> = [];
  let current: { number: number; lines: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(/^\s*chapter\s+(\d+)/i);
    if (match) {
      if (current) {
        const content = current.lines.join("\n").trim();
        if (content) chapters.push({ chapterNumber: current.number, content, wordCount: content.split(/\s+/).filter(Boolean).length });
      }
      current = { number: parseInt(match[1]), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) {
    const content = current.lines.join("\n").trim();
    if (content) chapters.push({ chapterNumber: current.number, content, wordCount: content.split(/\s+/).filter(Boolean).length });
  }
  return chapters;
}

export const storiesRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.prisma.story.findMany({
      include: {
        platform: true,
        _count: { select: { chapters: true } },
        chapters: {
          where: { status: "approved" },
          orderBy: { chapterNumber: "desc" },
          take: 1,
          select: { chapterNumber: true },
        },
        writingSessions: {
          orderBy: { sessionDate: "desc" },
          take: 1,
          select: { sessionDate: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })
  ),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.story.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          platform: true,
          voiceProfile: true,
          arcs: { orderBy: { order: "asc" } },
          _count: {
            select: {
              chapters: true,
              chapterOutlines: true,
              characters: true,
              plotThreads: true,
            },
          },
        },
      })
    ),

  create: publicProcedure
    .input(StoryCreateInput)
    .mutation(async ({ ctx, input }) => {
      const { existingOutline, existingChapters, ...storyData } = input;
      // Use outline as synopsis if no synopsis provided
      if (!storyData.synopsis && existingOutline) storyData.synopsis = existingOutline;

      const story = await ctx.prisma.story.create({
        data: storyData,
        include: { platform: true },
      });

      // Parse and create any pasted existing chapters
      if (existingChapters.trim()) {
        const parsed = parseExistingChapters(existingChapters);
        if (parsed.length > 0) {
          await ctx.prisma.chapter.createMany({
            data: parsed.map((ch) => ({
              storyId: story.id,
              chapterNumber: ch.chapterNumber,
              title: `Chapter ${ch.chapterNumber}`,
              content: ch.content,
              wordCount: ch.wordCount,
              status: "approved",
            })),
          });
          await ctx.prisma.story.update({
            where: { id: story.id },
            data: { status: "writing" },
          });
        }
      }

      return story;
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), data: StoryCreateInput.partial() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.story.update({
        where: { id: input.id },
        data: input.data,
        include: { platform: true },
      })
    ),

  updateStatus: publicProcedure
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.story.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    ),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.story.delete({ where: { id: input.id } })
    ),

  // Returns everything a writer needs to re-orient after a break
  resumeContext: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [lastChapter, protagonist, threads, lastSession] = await Promise.all([
        ctx.prisma.chapter.findFirst({
          where: { storyId: input.id, status: "approved" },
          orderBy: { chapterNumber: "desc" },
          select: { chapterNumber: true, content: true, hookType: true },
        }),
        ctx.prisma.character.findFirst({
          where: { storyId: input.id, role: "protagonist" },
          select: { name: true, currentArc: true },
        }),
        ctx.prisma.plotThread.findMany({
          where: { storyId: input.id, status: "open" },
          select: { title: true, description: true },
          take: 5,
        }),
        ctx.prisma.writingSession.findFirst({
          where: { storyId: input.id },
          orderBy: { sessionDate: "desc" },
          select: { sessionDate: true },
        }),
      ]);

      const nextChapterNumber = (lastChapter?.chapterNumber ?? 0) + 1;

      const nextOutline = await ctx.prisma.chapterOutline.findUnique({
        where: { storyId_chapterNumber: { storyId: input.id, chapterNumber: nextChapterNumber } },
        select: {
          sceneSummary: true,
          emotionalBeat: true,
          hookType: true,
          arc: { select: { name: true } },
        },
      });

      let closingLines = "";
      if (lastChapter?.content) {
        const sentences = lastChapter.content
          .split(/(?<=[.!?])\s+/)
          .filter((s) => s.trim().length > 20);
        closingLines = sentences.slice(-4).join(" ").trim();
      }

      const daysSince = lastSession
        ? Math.floor((Date.now() - new Date(lastSession.sessionDate).getTime()) / 86400000)
        : null;

      return {
        lastChapterNumber: lastChapter?.chapterNumber ?? 0,
        lastHookType: lastChapter?.hookType ?? null,
        closingLines,
        nextChapterNumber,
        nextOutline: nextOutline
          ? {
              sceneSummary: nextOutline.sceneSummary,
              emotionalBeat: nextOutline.emotionalBeat,
              hookType: nextOutline.hookType,
              arcName: nextOutline.arc?.name ?? null,
            }
          : null,
        protagonistName: protagonist?.name ?? null,
        protagonistState: protagonist?.currentArc ?? null,
        activeThreads: threads
          .filter((t) => !t.description.startsWith("[SEED]"))
          .map((t) => ({ title: t.title, note: t.description })),
        daysSince,
        lastSessionAt: lastSession?.sessionDate ?? null,
      };
    }),

  stats: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [chapters, outlines, sessions] = await Promise.all([
        ctx.prisma.chapter.findMany({
          where: { storyId: input.id, status: "approved" },
          select: { wordCount: true, chapterNumber: true },
        }),
        ctx.prisma.chapterOutline.count({ where: { storyId: input.id } }),
        ctx.prisma.writingSession.findMany({
          where: { storyId: input.id },
          orderBy: { sessionDate: "desc" },
          take: 30,
        }),
      ]);
      const totalWords = chapters.reduce((s, c) => s + c.wordCount, 0);
      const story = await ctx.prisma.story.findUniqueOrThrow({
        where: { id: input.id },
        select: { targetChapters: true },
      });
      return {
        chaptersWritten: chapters.length,
        totalWords,
        outlinesCreated: outlines,
        targetChapters: story.targetChapters,
        completionPct: Math.round((chapters.length / story.targetChapters) * 100),
        recentSessions: sessions,
      };
    }),
});
