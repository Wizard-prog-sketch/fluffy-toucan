import { z } from "zod";
import { publicProcedure, router } from "../server";

const FeedbackInput = z.object({
  storyId: z.string(),
  scope: z.enum(["story", "plot", "chapter"]).default("story"),
  chapterNumber: z.number().int().optional(),
  category: z.enum(["voice", "pacing", "character", "plot", "hook", "emotion", "dialogue", "structure", "rejection", "general"]).default("general"),
  severity: z.enum(["high", "medium", "low"]).default("medium"),
  feedback: z.string().min(1),
});

export const feedbackRouter = router({
  byStory: publicProcedure
    .input(z.object({ storyId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.storyFeedback.findMany({
        where: { storyId: input.storyId },
        orderBy: [{ resolved: "asc" }, { severity: "asc" }, { createdAt: "desc" }],
      })
    ),

  activeCount: publicProcedure
    .input(z.object({ storyId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.storyFeedback.count({
        where: { storyId: input.storyId, resolved: false },
      })
    ),

  add: publicProcedure
    .input(FeedbackInput)
    .mutation(({ ctx, input }) =>
      ctx.prisma.storyFeedback.create({ data: input })
    ),

  resolve: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.storyFeedback.update({
        where: { id: input.id },
        data: { resolved: true },
      })
    ),

  reopen: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.storyFeedback.update({
        where: { id: input.id },
        data: { resolved: false },
      })
    ),

  update: publicProcedure
    .input(z.object({ id: z.string(), feedback: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.storyFeedback.update({
        where: { id: input.id },
        data: { feedback: input.feedback },
      })
    ),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.storyFeedback.delete({ where: { id: input.id } })
    ),
});
