import { z } from "zod";
import { publicProcedure, router } from "../server";

const VoiceInput = z.object({
  storyId: z.string(),
  writingStyle: z.enum(["cinematic", "intimate-first", "dramatic-third", "action-forward", "slow-burn"]),
  dialogueIntensity: z.enum(["low", "medium", "high"]),
  descriptionDensity: z.enum(["sparse", "medium", "rich"]),
  toneRegister: z.enum(["dark-gritty", "warm-light", "intense", "suspense"]),
  sampleText: z.string().default(""),
});

interface VoiceData {
  writingStyle: string;
  dialogueIntensity: string;
  descriptionDensity: string;
  toneRegister: string;
  sampleText: string;
}

function buildSystemPromptSnippet(data: VoiceData): string {
  const styleMap: Record<string, string> = {
    "cinematic": `NARRATIVE POV & STYLE — Cinematic third-person: Write visually and kinetically, like a camera that can see inside someone's chest. Sharp scene cuts. Sensory precision. No sentence wasted on throat-clearing. The reader sees the world in motion, not in tableau.`,
    "intimate-first": `NARRATIVE POV & STYLE — Close first-person: The narrator IS the protagonist — every word is filtered through her/his consciousness, her/his biases, her/his blind spots. The reader knows things the protagonist doesn't know they're revealing. Interiority is the story. What she doesn't say is as important as what she does.`,
    "dramatic-third": `NARRATIVE POV & STYLE — Dramatic third-person omniscient: Sweeping emotional access. The narrative can move between minds but always serves the protagonist's truth. Emotional declarations are earned, not stated. The narrator's voice has weight, authority, and feeling.`,
    "action-forward": `NARRATIVE POV & STYLE — Action-forward third-person: Propulsive. Short sentences when tension rises. Longer ones only when the character needs to breathe. Every paragraph ends in motion. The story doesn't pause — it accelerates or redirects, but it never stops.`,
    "slow-burn": `NARRATIVE POV & STYLE — Slow-burn intimate: Tension built through what isn't said. A glance holds more weight than a declaration. The emotional truth arrives late, always. Characters circle the thing they want without naming it. The reader feels the charge building chapters before it breaks.`,
  };

  const toneMap: Record<string, string> = {
    "dark-gritty": `TONAL REGISTER — Dark and unsparing: The world of this story has edges. Characters are capable of cruelty, including the ones we love. Moral ambiguity is not a stylistic choice — it's honesty. Hope exists but it's earned through pain, not given. Violence (emotional or physical) has consequences that echo.`,
    "warm-light": `TONAL REGISTER — Warm with shadows: The story believes in people — even the broken ones, maybe especially the broken ones. Conflict is real and it hurts, but underneath it there is always the possibility of something better. Humor arrives at unexpected moments and makes the heartbreak hit harder.`,
    "intense": `TONAL REGISTER — Emotionally intense: Everything in this story matters enormously. The stakes are personal, not just dramatic. A quiet conversation carries the weight of everything unsaid for years. The reader should feel slightly breathless throughout — not from action, from feeling.`,
    "suspense": `TONAL REGISTER — Suspense and dread: Something is always slightly wrong, even in the good moments. The reader trusts the story but fears it. Comfort is always temporary. The narrative withholds just enough that the reader can never fully exhale. Every revelation spawns a new question.`,
  };

  const dialogueMap: Record<string, string> = {
    "low": `DIALOGUE — Sparse and lethal: Characters speak when silence won't do. When they do speak, every line is doing three things: revealing character, advancing tension, and withholding something. Short exchanges. Long pauses implied. What they don't say out loud is said in action or interiority.`,
    "medium": `DIALOGUE — Balanced and revealing: Conversation carries the story's middle weight alongside action and interiority. Characters talk the way real people do under pressure — sometimes too much, sometimes they stop mid-sentence. Subtext runs beneath every exchange. No dialogue exists just to convey information.`,
    "high": `DIALOGUE — Dialogue-dominant: Characters are defined by how they speak. Each person has a rhythm, a vocabulary, a way of deflecting. Confrontations happen in words. Declarations are made and regretted and made again. The reader can identify every character by their dialogue alone — no attribution needed.`,
  };

  const descMap: Record<string, string> = {
    "sparse": `DESCRIPTION — Precise and minimal: One detail that does the work of ten. The description earns every word by being the exact right thing — not beautiful, but true. Sense impressions arrive when they matter. The reader's imagination completes the world.`,
    "medium": `DESCRIPTION — Grounded and selective: Enough detail to anchor the reader in the scene without drowning the momentum. Settings carry emotional weight — the same room feels different before and after a revelation. Description is never neutral; it's colored by who's observing and what they're feeling.`,
    "rich": `DESCRIPTION — Immersive and textured: The world of this story is fully realized — it has a smell, a temperature, a quality of light. Descriptions serve the emotional truth of the scene. A sumptuous setting becomes suffocating when the relationship in it is failing. The physical world mirrors the interior one.`,
  };

  const emotionalPhilosophy = `
CORE WRITING PHILOSOPHY — PROTECT THIS IN EVERY CHAPTER:
- Readers pay to feel something specific. Deliver that feeling, not a description of it.
- Every scene has an emotional entry point, emotional progression, and emotional exit. Know all three before you write the first sentence.
- The protagonist's wound is not backstory. It is the lens through which they see every scene. It colors what they notice, what they misread, what they want and refuse to want.
- Do not rush the moments that matter. If this is the scene readers have been waiting for, give it space. Give it weight. Let it breathe and hurt and mean something.
- A chapter that ends on a plot cliffhanger is good. A chapter that ends on an EMOTIONAL cliffhanger — where something irreversible has happened inside a character — is what makes someone call in sick tomorrow to keep reading.

VOICE CONSISTENCY — NON-NEGOTIABLE ACROSS ALL CHAPTERS:
- The sentence rhythm of this story does not change. If the story opens with short declarative sentences under emotional pressure, that pattern holds at chapter 200.
- The ratio of interiority to action does not drift. If the writer is inside the protagonist's head 40% of the time in Chapter 1, the same ratio holds throughout.
- The vocabulary register does not shift. If the writer uses precise, unglamorous words, they do not suddenly switch to florid description 80 chapters in.
- The emotional temperature at the start of each chapter is consistent with the story's established register — not artificially elevated or deflated.
- Voice drift is invisible to the writer, obvious to the reader. It is one of the most common causes of subscription cancellation on serialized fiction platforms.`;

  return [
    styleMap[data.writingStyle] ?? "",
    toneMap[data.toneRegister] ?? "",
    dialogueMap[data.dialogueIntensity] ?? "",
    descMap[data.descriptionDensity] ?? "",
    emotionalPhilosophy,
  ].filter(Boolean).join("\n\n");
}

export const voiceRouter = router({
  byStory: publicProcedure
    .input(z.object({ storyId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.voiceProfile.findUnique({ where: { storyId: input.storyId } })
    ),

  upsert: publicProcedure
    .input(VoiceInput)
    .mutation(({ ctx, input }) => {
      const { storyId, ...rest } = input;
      const systemPromptSnippet = buildSystemPromptSnippet(rest);
      return ctx.prisma.voiceProfile.upsert({
        where: { storyId },
        create: { storyId, ...rest, systemPromptSnippet },
        update: { ...rest, systemPromptSnippet },
      });
    }),
});
