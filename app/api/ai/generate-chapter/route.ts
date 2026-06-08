import { NextRequest } from "next/server";
import { buildChapterContext } from "@/lib/ai/contextBuilder";
import { buildChapterPrompt } from "@/lib/ai/chapterEngine";
import { getAI } from "@/lib/ai/client";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { storyId, chapterNumber } = await req.json();

  if (!storyId || !chapterNumber) {
    return new Response(JSON.stringify({ error: "Missing storyId or chapterNumber" }), { status: 400 });
  }

  const ctx = await buildChapterContext(storyId, chapterNumber);
  const { system, user } = buildChapterPrompt(ctx);
  const ai = getAI();

  const encoder = new TextEncoder();
  let content = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aiStream = await ai.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 4096,
          system,
          messages: [{ role: "user", content: user }],
        });

        for await (const chunk of aiStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            content += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        const wordCount = content.trim().split(/\s+/).length;

        await prisma.chapter.upsert({
          where: { storyId_chapterNumber: { storyId, chapterNumber } },
          create: { storyId, chapterNumber, content, wordCount, status: "draft", hookType: ctx.outline.hookType },
          update: { content, wordCount, status: "draft", hookType: ctx.outline.hookType },
        });

        await prisma.hookLog.create({
          data: { storyId, chapterNumber, hookType: ctx.outline.hookType, hookSummary: ctx.outline.hookDescription },
        });

        controller.close();
      } catch (err: any) {
        controller.enqueue(encoder.encode(`\n\n[ERROR: ${err.message}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
