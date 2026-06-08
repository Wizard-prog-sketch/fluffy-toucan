import { NextRequest } from "next/server";
import { getAI } from "@/lib/ai/client";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { storyId } = await req.json();

  const [story, stats] = await Promise.all([
    prisma.story.findUniqueOrThrow({ where: { id: storyId }, include: { platform: true } }),
    prisma.chapter.aggregate({ where: { storyId, status: "approved" }, _count: true, _sum: { wordCount: true } }),
  ]);

  const ai = getAI();
  const msg = await ai.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2000,
    system: `You are a publishing consultant specializing in ${story.platform.name} serialized fiction. You write submission packages that perform well on the platform's discovery and search systems.`,
    messages: [{
      role: "user",
      content: `Create a complete submission package for this story:

Title: ${story.title}
Genre: ${story.genre}${story.subGenre ? ` / ${story.subGenre}` : ""}
Platform: ${story.platform.name}
Synopsis: ${story.synopsis}
Chapters written: ${stats._count}
Total words: ${stats._sum.wordCount ?? 0}
Platform submission notes: ${story.platform.submissionNotes}

Generate:
1. 3 optimized title options (with rationale for each)
2. A platform-optimized synopsis (150-200 words, emotional hook first, no spoilers)
3. 8-10 recommended tags/keywords for platform search
4. Specific submission notes for ${story.platform.name}

Respond in JSON:
{
  "titles": [{ "title": "...", "rationale": "..." }],
  "synopsis": "...",
  "tags": ["...", "..."],
  "platformNotes": "..."
}`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return Response.json({ error: "Failed to parse AI response" }, { status: 500 });
  return Response.json(JSON.parse(jsonMatch[0]));
}
