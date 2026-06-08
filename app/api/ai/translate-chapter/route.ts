import { NextRequest } from "next/server";
import { buildTranslationPrompt } from "@/lib/ai/translationEngine";
import { getAI } from "@/lib/ai/client";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const { storyId, chapterNumber, sourceLanguage, targetLanguage } = await req.json();

  if (!storyId || !chapterNumber || !sourceLanguage || !targetLanguage) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  if (sourceLanguage === targetLanguage) {
    return new Response(JSON.stringify({ error: "Source and target languages must be different" }), { status: 400 });
  }

  // Load the chapter content
  const chapter = await prisma.chapter.findUnique({
    where: { storyId_chapterNumber: { storyId, chapterNumber } },
    select: { id: true, content: true },
  });

  if (!chapter || !chapter.content.trim()) {
    return new Response(JSON.stringify({ error: "Chapter not found or has no content" }), { status: 404 });
  }

  const prompt = buildTranslationPrompt(sourceLanguage, targetLanguage, chapter.content);
  const ai = getAI();
  const encoder = new TextEncoder();
  let translated = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aiStream = ai.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 8192,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of aiStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            translated += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        // Save the completed translation
        const wordCount = translated.trim().split(/\s+/).length;
        await prisma.chapterTranslation.upsert({
          where: { chapterId_targetLanguage: { chapterId: chapter.id, targetLanguage } },
          create: {
            storyId,
            chapterId: chapter.id,
            chapterNumber,
            sourceLanguage,
            targetLanguage,
            content: translated,
            wordCount,
          },
          update: {
            sourceLanguage,
            content: translated,
            wordCount,
          },
        });

        controller.close();
      } catch (err: any) {
        controller.enqueue(encoder.encode(`\n\n[TRANSLATION ERROR: ${err.message}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
