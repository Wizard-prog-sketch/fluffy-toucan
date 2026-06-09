import { getAI } from "./client";

export interface GeneratedArc {
  order: number;
  name: string;
  summary: string;
  emotionalArc: string;
  startChapter: number;
  endChapter: number;
}

export interface GeneratedOutline {
  chapterNumber: number;
  title: string;
  sceneSummary: string;
  location: string;
  emotionalBeat: string;
  revelations: string;
  withheld: string;
  hookType: string;
  hookDescription: string;
  wordCountTarget: number;
}

export async function generateArcStructure(
  story: { title: string; genre: string; synopsis: string; targetChapters: number },
  platform: { name: string; paceProfile: string }
): Promise<GeneratedArc[]> {
  const ai = getAI();

  const msg = await ai.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 5000,
    system: `You are a master story architect for ${platform.name} premium serialized fiction.

You understand the fundamental truth: a story feels too long only when the reader stops caring. A story never feels too long when the reader is desperate for more. Your job is to architect a story so emotionally rich that ${story.targetChapters} chapters feel like they ended too soon.

YOUR ARC DESIGN PRINCIPLES:

CENTRAL CONFLICT WITH GENERATIONAL DEPTH
The central conflict is not built around a single problem that gets solved and replaced. It is built around a conflict so layered and emotionally loaded that it takes the entire story to unpack. At ${story.targetChapters} chapters, that conflict must be rooted deeply enough that it has layers the reader does not know exist in the early chapters. It must have history that predates the protagonist's life. It must operate simultaneously on personal, relational, and social levels.

ESCALATING STAKES THAT NEVER PLATEAU
Each arc partially solves the previous problem — then reveals a bigger and more dangerous problem underneath. By the final arc, the reader must feel the full accumulated weight of everything that built to that point. Heavier, richer, more dangerous than chapter one — but completely logical given the journey.

MULTIPLE PROTAGONIST TRANSFORMATIONS
At ${story.targetChapters} chapters, the protagonist undergoes multiple complete transformations, each building on the last. They become someone new by the first quarter. That person is broken down and rebuilt into someone deeper by the halfway point. What emerges at the end is unrecognizable from the beginning — but in a way that feels completely inevitable.

EMOTIONAL SEASONS — MANAGING READER FATIGUE
A story that is relentlessly intense burns readers out. Premium long-form stories cycle their emotional register deliberately: periods of high danger and stakes, periods of warmth and relationship deepening, periods of mystery and discovery, periods of triumph and satisfaction. Design these seasons into the arc structure.

PAYOFF ARCHITECTURE BUILT FROM ARC ONE
Every major emotional payoff was set up far in advance. The revelation that shocks the reader at chapter 200 was quietly seeded in chapter 20. This sense of inevitability — that everything was connected all along — is what makes readers call a story brilliant.`,

    messages: [{
      role: "user",
      content: `Design the complete multi-arc structure for:

Title: "${story.title}"
Genre: ${story.genre}
Synopsis: ${story.synopsis}
Total chapters: ${story.targetChapters}
Platform: ${platform.name} | Pace: ${platform.paceProfile}

CREATE 5-7 ARCS that cover all ${story.targetChapters} chapters.

EMOTIONAL SEASON DISTRIBUTION (required):
- Arc 1: Ignition — hook fast, establish wound and world, earn the subscription
- Arc 2: Deepening — fall in love with characters, deepen central conflict
- Arc 3: Escalation — partial solutions open bigger problems, stakes compound
- Arc 4 (60-75% mark): Crucible — the most emotionally brutal arc; this is where readers cry and keep reading
- Arc 5+: Convergence and Resolution — planted seeds pay off, protagonist's final transformation

REQUIRED STRUCTURAL ELEMENTS:
1. Each arc must have a distinct emotional question — not just a plot question
2. Arc 3 or 4 must contain a major plot twist seeded from the very first arc — note it explicitly
3. The antagonist must evolve across arcs — note their arc-by-arc development
4. At least one secondary character must have their own arc trajectory described
5. Every arc closure must pivot the reader into the next arc with new urgency

Respond in exact JSON:
{
  "arcs": [
    {
      "order": 1,
      "name": "Evocative arc name — not generic",
      "summary": "4-5 sentences: what happens AND what it means emotionally. Include specific events, not just themes. Name the emotional season of this arc.",
      "emotionalArc": "The protagonist's precise inner journey: where they START emotionally (specific state), what specific event or revelation breaks them open, where they END (changed but not resolved — state the new wound or capacity they carry into the next arc)",
      "startChapter": 1,
      "endChapter": 30
    }
  ]
}`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid arc JSON");
  return JSON.parse(jsonMatch[0]).arcs;
}

export async function generateChapterOutlines(
  story: { title: string; genre: string; synopsis: string },
  arc: { name: string; summary: string; emotionalArc: string; startChapter: number; endChapter: number },
  platform: { name: string; targetChapterWords: number; hookIntensity: string },
  existingCharacters: string[]
): Promise<GeneratedOutline[]> {
  const ai = getAI();
  const count = arc.endChapter - arc.startChapter + 1;
  const isFirstArc = arc.startChapter === 1;
  const isOpeningRange = arc.startChapter <= 5;

  const msg = await ai.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 12000,
    system: `You are a premium serialized fiction story planner for ${platform.name}.

You plan chapters the way a showrunner plans episodes — every chapter has a purpose, a feeling, and a consequence. No filler exists. Every chapter either changes something, reveals something, or deepens something in a way the reader will feel.

THE LAW OF THE SINGLE DRIVE
Every chapter moves toward one specific thing — one scene, one confrontation, one revelation, one emotional beat, one turning point. A chapter that wanders or tries to accomplish too many things is a chapter readers rush through. A chapter with a clear felt drive is a chapter readers are pulled through.

THE OPENING LINE RULE
Every chapter outline must specify an opening image or situation that begins mid-moment. No weather. No waking up. No character looking around taking stock. The first sentence of every chapter must earn the next thousand words.

THE CLOSING HOOK
The hook is not applied to the end of the chapter — it is the destination the chapter was always moving toward. It earns its force from everything that came before it. Specify the exact moment, image, or line, not just the type.

SEED-AND-PAYOFF ARCHITECTURE
Mark any detail that is being planted for a future payoff with [SEED]. Be specific about what the seed is. Seeds create the sense that the story was designed all along — that the reader who goes back and re-reads will see it was always there.

THE TRUST CHAIN
Readers subscribe because they trust the story to keep its promises. Every chapter outline must note what promise it is making to the reader (a confrontation coming, a secret about to break, a relationship on the edge) and what promise from a previous chapter it is honoring.`,

    messages: [{
      role: "user",
      content: `Create complete chapter outlines for:

Story: "${story.title}" (${story.genre})
Synopsis: ${story.synopsis}
Arc: "${arc.name}" — Chapters ${arc.startChapter}–${arc.endChapter}
Arc summary: ${arc.summary}
Arc emotional journey: ${arc.emotionalArc}
Platform: ${platform.name} | Hook intensity: ${platform.hookIntensity} | Target words/chapter: ${platform.targetChapterWords}
Established characters: ${existingCharacters.join(", ") || "None yet — this arc introduces the cast"}

${isFirstArc ? `FIRST ARC REQUIREMENTS:
- Chapter 1: Establish the protagonist's wound in the first 200 words. Do not wait. The reader must feel who this person is and what broke them before the story even begins.
- Chapter 1: The world must be established through the protagonist's eyes and emotional state — not through description but through what they notice and how they interpret it.
- By Chapter 3: The reader must be afraid of what they want for the protagonist.
- By Chapter 5: The inciting incident has arrived and cannot be undone.` : ""}

${isOpeningRange ? `SUBSCRIPTION-EARNING RULES FOR EARLY CHAPTERS:
The reader is deciding whether to subscribe. Every chapter in this range must end with an emotional reason to open the next one immediately. The cost of losing a reader here is losing them forever.` : ""}

REQUIRED FOR EVERY CHAPTER OUTLINE:
1. Single Drive: One specific thing this chapter moves toward — not a theme, a specific scene or moment
2. Opening: What moment does the chapter begin mid — the first image, the situation already in motion
3. Emotional Beat: What the reader must FEEL by the end — not what happens, what emotion is delivered
4. Revelations: What truth surfaces — mark seeds with [SEED] and specify exactly what is seeded
5. Withheld: What question does this chapter plant that the reader cannot stop thinking about
6. Promise Made: What does this chapter promise the reader is coming (even if chapters away)
7. Hook: The exact final moment — specific image, line, or event, not just the category

HOOK ROTATION (never same type 3 chapters in a row):
- revelation: reframes everything the reader thought they knew
- confrontation: two forces collide — the real confrontation is internal
- gut-punch: the emotional infrastructure the reader counted on breaks
- danger: real threat the reader believes
- mystery: a specific wrongness the reader cannot stop turning over
- arrival: someone whose presence changes every calculation

Generate exactly ${count} chapter outlines for chapters ${arc.startChapter} through ${arc.endChapter}.

Respond in exact JSON — every field must be fully written out, not placeholder text:
{
  "outlines": [
    {
      "chapterNumber": ${arc.startChapter},
      "title": "Title that hints without spoiling — specific and evocative",
      "sceneSummary": "The single drive of this chapter — who does what, what is said, what changes. 3-4 specific sentences.",
      "location": "Specific location with emotional loading — not 'his office' but 'his office at 11pm, the rest of the building dark'",
      "emotionalBeat": "What the reader must feel by the end of this chapter. Specific — not 'suspense' but 'the sick certainty that someone they trusted has been lying for months'",
      "revelations": "What truth surfaces this chapter. Use [SEED] prefix for future payoff details. Be exact.",
      "withheld": "What question this chapter plants — what the reader needs to know but cannot yet",
      "hookType": "revelation | confrontation | gut-punch | danger | mystery | arrival",
      "hookDescription": "The exact final moment: the specific image, the line of dialogue, the thing seen or heard. Not the category — the moment itself.",
      "wordCountTarget": ${platform.targetChapterWords}
    }
  ]
}`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid outline JSON");
  return JSON.parse(jsonMatch[0]).outlines;
}

export async function analyzeExistingOutline(
  outline: string,
  platform: { name: string; targetChapterWords: number; hookIntensity: string; paceProfile: string }
): Promise<{ issues: Array<{ chapter?: string; type: string; description: string; severity: "high" | "medium" | "low" }> }> {
  const ai = getAI();

  const msg = await ai.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: `You are a senior developmental editor who has worked on the top-performing serialized fiction on ${platform.name}.

You know what breaks reader trust. You know where outlines fail long before the writer realizes it — often 100 chapters before the reader notices. You are direct because the cost of a gentle assessment is that the writer loses subscribers at chapter 80 instead of knowing now.

YOU ANALYZE FOR:

TRUST FAILURES — promises made and not paid
Every promise a story makes to a reader — a confrontation is coming, a secret is almost out, a relationship is on the edge — must be honored with full emotional weight. An outline that makes promises and then defers or forgets them is building debt that destroys subscriptions.

EMOTIONAL FLATNESS
An outline full of events but no felt emotional milestones is an outline for a story that readers will summarize as "a lot happens but I didn't really feel anything." Every arc must have a specific emotional target. Every chapter must move toward a feeling.

PROTAGONIST STAGNATION
A protagonist who makes the same emotional mistake repeatedly without consequence or growth is a protagonist readers stop caring about. At long-form scale, the protagonist must undergo multiple complete transformations. An outline where the protagonist's internal state is essentially the same at chapter 150 as at chapter 50 will lose subscribers at exactly that stretch.

ANTAGONIST DECAY
An antagonist who is exactly the same in chapter 200 as in chapter 10 is an antagonist who is wasting the story's potential. They must evolve — through loss, through victory, through revelation about their own wound.

REVELATION TIMING
A revelation placed proportionally wrong for the story's true length creates dead air. A secret revealed in chapter 40 of a 400-chapter story leaves 360 chapters without that tension. Every major revelation must be proportionally positioned for the actual total length.

MISSING SEEDS
Every major twist must have setup planted far in advance. An outline where major twists arrive without prior seeding creates "cheap twist" reader reactions — they feel cheated, not surprised.

READER FATIGUE
Relentless intensity without emotional seasons burns readers out by the midpoint. An outline with no breathing space — no periods of warmth, discovery, or triumph — will lose subscribers who feel exhausted rather than addicted.`,

    messages: [{
      role: "user",
      content: `Conduct a full structural, emotional, and long-form viability analysis of this outline:

Platform: ${platform.name} | Pace: ${platform.paceProfile} | Hook intensity: ${platform.hookIntensity} | Target chapter words: ${platform.targetChapterWords}

OUTLINE:
${outline}

Analyze every dimension:
- Trust failures: promises made without payoff, payoffs without setup
- Emotional trajectory: does the story have a beating emotional heart across its full length, or just events?
- Protagonist arc: is there evidence of multiple transformations or stagnation?
- Antagonist development: do they evolve or remain static?
- Revelation timing: are major revelations proportionally placed for the story's actual length?
- Missing seeds: what arrives later without setup?
- Emotional seasons: is there deliberate variation between intensity and breathing space?
- Filler chapters: chapters that neither change nor reveal anything felt
- Subscription risk points: where will readers disengage and stop paying?

Be specific. Name chapters. Describe the exact failure and its consequence for subscribers.

Respond in JSON:
{
  "issues": [
    {
      "chapter": "Ch. 15-20",
      "type": "trust | emotion | stagnation | antagonist | timing | seed | fatigue | filler | subscription-risk",
      "description": "Specific description of the problem, why it exists, and what it costs the story in subscriber terms",
      "severity": "high | medium | low"
    }
  ]
}`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { issues: [] };
  return JSON.parse(jsonMatch[0]);
}
