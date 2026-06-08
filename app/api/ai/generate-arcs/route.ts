import { NextRequest } from "next/server";
import { generateArcStructure } from "@/lib/ai/plotEngine";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { storyId } = await req.json();

  const story = await prisma.story.findUniqueOrThrow({
    where: { id: storyId },
    include: { platform: true },
  });

  const arcs = await generateArcStructure(
    { title: story.title, genre: story.genre, synopsis: story.synopsis, targetChapters: story.targetChapters },
    story.platform
  );

  await prisma.arc.deleteMany({ where: { storyId } });
  const created = await prisma.arc.createMany({
    data: arcs.map((a) => ({ ...a, storyId })),
  });

  return Response.json({ count: created.count, arcs });
}
