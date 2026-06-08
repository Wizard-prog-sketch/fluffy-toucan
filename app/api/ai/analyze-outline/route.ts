import { NextRequest } from "next/server";
import { analyzeExistingOutline } from "@/lib/ai/plotEngine";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { storyId, outlineText } = await req.json();

  const story = await prisma.story.findUniqueOrThrow({
    where: { id: storyId },
    include: { platform: true },
  });

  const result = await analyzeExistingOutline(outlineText, story.platform);
  return Response.json(result);
}
