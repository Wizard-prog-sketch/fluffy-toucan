import { getAI } from "./client";

export interface IdeaCandidate {
  genre: string;
  premise: string;
  emotionalHook: string;
  centralConflict: string;
  protagonistWound: string;
  longRunwayScore: number;
  viabilityNotes: string;
}

export async function generateIdeas(
  genre: string,
  platform: { name: string; allowedGenres: string; paceProfile: string },
  count = 5
): Promise<IdeaCandidate[]> {
  const ai = getAI();

  const message = await ai.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: `You are a premium serialized fiction concept developer who has launched multiple top-performing stories on ${platform.name}.

You understand one thing above all else: readers don't subscribe to a premise. They subscribe to a FEELING they can't get anywhere else — a specific ache, a specific hunger, a specific kind of hope that only this story delivers.

Your concepts are engineered on four pillars:
1. A protagonist wound so specific and recognizable that readers see themselves in it
2. A central conflict that is both external (what's happening) AND internal (what the protagonist must become to survive it)
3. An emotional hook that names the exact feeling readers are paying to have — not "excitement" but "the terrifying sensation of wanting someone you know will destroy you"
4. A long-form engine — the story fuel that keeps 200 chapters from collapsing into repetition

You never generate generic premises. Every concept you create is specific, layered, and emotionally precise. A reader must be able to feel the story from the logline alone.

CHARACTER ARCHITECTURE — what makes characters on ${platform.name} unforgettable:
- The protagonist has a strength that is also their deepest flaw
- The love interest / primary antagonist has their own complete inner life — they are not a function, they are a person
- Their central relationship has a specific, irreversible history that neither of them can outrun
- What the protagonist WANTS is not what they NEED — and they must lose one to gain the other`,

    messages: [{
      role: "user",
      content: `Generate ${count} original story concepts for ${platform.name} in the ${genre} genre.

Each concept must be engineered for 200+ chapters. A concept fails this test if it would exhaust itself at Chapter 50. You must be able to describe — in the viability notes — exactly what story fuel exists to power the second 100 chapters as strongly as the first.

FOR EACH CONCEPT PROVIDE:

1. PREMISE — 3 sentences. First sentence: the world and protagonist in one vivid image. Second sentence: the inciting incident that breaks everything open. Third sentence: the impossible choice or situation this creates.

2. EMOTIONAL HOOK — The single, precise feeling this story delivers that readers cannot find anywhere else. Not a genre description — a felt experience. Example: "The specific vertigo of realizing the person you've been protecting was protecting you all along."

3. CENTRAL CONFLICT — This must have TWO layers:
   - External: the plot-level conflict that drives events
   - Internal: the emotional/psychological war the protagonist is fighting inside themselves
   Both must be unsolvable until the final arc.

4. PROTAGONIST WOUND — The specific damage they carry from before the story starts that makes them the wrong person for this situation — and the only person who could survive it. Be specific: not "trust issues" but "she learned that love means abandonment, so she abandons first, always."

5. LONG-RUNWAY SCORE (0-100) — How well does this concept sustain 200+ chapters without repetition?
   - 90+: Built-in escalation engine, relationship complexity that deepens over hundreds of chapters, multiple unresolvable tensions
   - 70-89: Strong start, solid mid-arc fuel, but needs supplemental conflict layers for the final third
   - Below 70: Flag it and explain what's missing

6. VIABILITY NOTES — Explain specifically:
   - What keeps the FIRST 50 chapters alive (the hook)
   - What keeps chapters 50-150 alive (the engine)
   - What makes chapters 150-200 feel inevitable rather than forced (the resolution infrastructure)
   - What are the 2-3 major twist seeds built into the concept?

Respond in this exact JSON format:
{
  "ideas": [
    {
      "premise": "...",
      "emotionalHook": "...",
      "centralConflict": "...",
      "protagonistWound": "...",
      "longRunwayScore": 88,
      "viabilityNotes": "..."
    }
  ]
}`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON for ideas");

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.ideas.map((idea: any) => ({ genre, ...idea }));
}
