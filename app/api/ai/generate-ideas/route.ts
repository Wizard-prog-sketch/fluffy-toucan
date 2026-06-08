import { NextRequest } from "next/server";
import { generateIdeas } from "@/lib/ai/ideaEngine";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { genre, platformId, storyId } = await req.json();

  const platform = await prisma.platform.findUniqueOrThrow({ where: { id: platformId } });
  const ideas = await generateIdeas(genre, platform);

  if (storyId) {
    await prisma.ideaCandidate.createMany({
      data: ideas.map((i) => ({ ...i, storyId })),
    });
  }

  return Response.json({ ideas });
}
