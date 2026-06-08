import { NextRequest } from "next/server";
import { generateChapterOutlines } from "@/lib/ai/plotEngine";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { storyId, arcId } = await req.json();

  const [story, arc, characters] = await Promise.all([
    prisma.story.findUniqueOrThrow({ where: { id: storyId }, include: { platform: true } }),
    prisma.arc.findUniqueOrThrow({ where: { id: arcId } }),
    prisma.character.findMany({ where: { storyId }, select: { name: true } }),
  ]);

  const outlines = await generateChapterOutlines(
    { title: story.title, genre: story.genre, synopsis: story.synopsis },
    arc,
    story.platform,
    characters.map((c) => c.name)
  );

  const results = [];
  for (const o of outlines) {
    const r = await prisma.chapterOutline.upsert({
      where: { storyId_chapterNumber: { storyId, chapterNumber: o.chapterNumber } },
      create: { ...o, storyId, arcId },
      update: { ...o, arcId },
    });
    results.push(r);
  }

  return Response.json({ count: results.length, outlines: results });
}
