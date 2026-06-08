import prisma from "@/lib/prisma";

export interface ChapterContext {
  storyTitle: string;
  genre: string;
  platform: { name: string; paceProfile: string; hookIntensity: string; targetChapterWords: number };
  voiceSnippet: string;
  arcName: string;
  arcSummary: string;
  arcEmotionalArc: string;
  arcPosition: string;
  arcStartChapter: number;
  arcEndChapter: number;
  arcProgressPct: number;
  // Protagonist
  protagonistEmotionalState: string;
  protagonistTransformationStage: string;
  // Emotional season
  emotionalSeason: string;
  emotionalSeasonGuidance: string;
  // Trust architecture
  activePromises: string;
  plantedSeeds: string;
  outline: {
    chapterNumber: number;
    sceneSummary: string;
    location: string;
    emotionalBeat: string;
    revelations: string;
    withheld: string;
    hookType: string;
    hookDescription: string;
    wordCountTarget: number;
  };
  recentChapterSummaries: string;
  bibleSummary: string;
  keyCharacters: string;
  openThreads: string;
  recentHooks: string;
  writerFeedback: string;
  voiceAnchor: string;
}

function deriveEmotionalSeason(
  chapterNumber: number,
  targetChapters: number,
  arcProgressPct: number,
  recentHookTypes: string[]
): { season: string; guidance: string } {
  const storyPct = Math.round((chapterNumber / targetChapters) * 100);
  const lastFiveHooks = recentHookTypes.slice(0, 5);
  const intensiveCount = lastFiveHooks.filter((h) =>
    ["gut-punch", "danger", "confrontation"].includes(h)
  ).length;

  // High-intensity run — needs a breath
  if (intensiveCount >= 3) {
    return {
      season: "breathing space",
      guidance:
        "The last several chapters have been emotionally intense. This chapter can afford a lower surface intensity — a moment of connection, quiet revelation, or deceptive calm — that makes the next surge hit harder. Do not mistake breathing space for filler: this chapter still advances character and deepens tension, just without the emergency-level stakes.",
    };
  }

  // Opening chapters — hook fast
  if (storyPct < 10) {
    return {
      season: "ignition",
      guidance:
        "These are the chapters that earn the subscription. Every scene must establish something essential — character, wound, world, or conflict — and every chapter must end with a reason to open the next one immediately.",
    };
  }

  // 10–35% — build and deepen
  if (storyPct < 35) {
    return {
      season: "deepening",
      guidance:
        "The reader is invested but not yet committed. Deepen the central relationship and the central conflict simultaneously. This is where readers fall in love with characters or decide they don't care. Make them care.",
    };
  }

  // 35–60% — escalation
  if (storyPct < 60) {
    return {
      season: "escalation",
      guidance:
        "Stakes must grow as a logical consequence of what has already happened — not randomly, but as the accumulated weight of every choice made so far. The protagonist's partial solutions are opening bigger problems underneath.",
    };
  }

  // 60–75% — the brutal middle
  if (storyPct < 75) {
    return {
      season: "crucible",
      guidance:
        "This is the most emotionally brutal section of the story — the place where the reader cries and keeps reading. The protagonist faces the consequences they have been building toward. Losses are real and lasting. The central relationship is tested at its deepest level.",
    };
  }

  // 75–90% — convergence
  if (storyPct < 90) {
    return {
      season: "convergence",
      guidance:
        "Forces align, old threads return, and the reader begins to see how everything connects. This section rewards long-term subscribers — seeds planted chapters ago are beginning to pay off visibly. The protagonist is becoming who they needed to become.",
    };
  }

  // Final stretch
  return {
    season: "resolution",
    guidance:
      "Every promise made to the reader is being honored. Every emotional debt is being paid. The climax must deliver the full weight of everything that came before it. Do not undercut emotional resolution with plot complications — the story has earned this.",
  };
}

function deriveTransformationStage(
  storyPct: number,
  targetChapters: number
): string {
  // At true long-form scale, protagonist undergoes multiple transformations
  if (storyPct < 25) {
    return "First transformation stage — the protagonist is who they were when the story started, their wound intact, their defenses in place. The reader is learning who they are before the story breaks them open.";
  }
  if (storyPct < 50) {
    return "First transformation complete or in progress — the protagonist has been broken open by events in the early arc. They are someone new compared to Chapter 1, but the deeper wound — the one they don't know they have — has not been touched yet.";
  }
  if (storyPct < 75) {
    return "Second transformation stage — the character the protagonist became after the first transformation is being tested and dismantled. What they thought they learned is being proved insufficient. This is the hardest growth — giving up an identity they already worked to build.";
  }
  return "Final transformation stage — the protagonist who emerges from the story's crucible is unrecognizable from who they were at the beginning, but every step of that change is visible in hindsight. They are finally capable of what the story required from the start.";
}

function extractActivePromises(plotThreads: { title: string; description: string; openedChapter: number }[]): string {
  if (!plotThreads.length) return "No active promises tracked — establish promises through open questions and approaching confrontations.";
  return plotThreads
    .map((t) => `• [Promise made Ch.${t.openedChapter}] ${t.title}: ${t.description}`)
    .join("\n");
}

function extractPlantedSeeds(plotThreads: { title: string; description: string; openedChapter: number; lastMentionedChapter: number }[]): string {
  const seeds = plotThreads.filter((t) => t.description.includes("[SEED]"));
  if (!seeds.length) return "No seeds explicitly marked yet — watch for details introduced in prior chapters that have not yet been explained or resolved.";
  return seeds
    .map((t) => `• [Seeded Ch.${t.openedChapter}, last mentioned Ch.${t.lastMentionedChapter}] ${t.title}: ${t.description.replace("[SEED]", "").trim()}`)
    .join("\n");
}

export async function buildChapterContext(storyId: string, chapterNumber: number): Promise<ChapterContext> {
  const [story, outline, recentChapters, bible, characters, plotThreads, hookLog, feedbackNotes, chapterOne] = await Promise.all([
    prisma.story.findUniqueOrThrow({
      where: { id: storyId },
      include: { platform: true, voiceProfile: true },
    }),
    prisma.chapterOutline.findUnique({
      where: { storyId_chapterNumber: { storyId, chapterNumber } },
      include: { arc: true },
    }),
    prisma.chapter.findMany({
      where: { storyId, chapterNumber: { gte: chapterNumber - 3, lt: chapterNumber }, status: "approved" },
      orderBy: { chapterNumber: "asc" },
      select: { chapterNumber: true, content: true, wordCount: true },
    }),
    prisma.storyBible.findUnique({ where: { storyId } }),
    prisma.character.findMany({ where: { storyId }, orderBy: { role: "asc" }, take: 10 }),
    prisma.plotThread.findMany({ where: { storyId, status: "open" } }),
    prisma.hookLog.findMany({
      where: { storyId },
      orderBy: { chapterNumber: "desc" },
      take: 10,
    }),
    prisma.storyFeedback.findMany({
      where: { storyId, resolved: false },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    }),
    // Chapter 1 as the permanent voice anchor for the entire story
    prisma.chapter.findUnique({
      where: { storyId_chapterNumber: { storyId, chapterNumber: 1 } },
      select: { content: true },
    }),
  ]);

  // ── Arc geometry ───────────────────────────────────────────────
  const arc = outline?.arc;
  const arcStart = arc?.startChapter ?? chapterNumber;
  const arcEnd = arc?.endChapter ?? chapterNumber;
  const arcLength = arcEnd - arcStart + 1;
  const arcPos = chapterNumber - arcStart + 1;
  const arcProgressPct = Math.round((arcPos / arcLength) * 100);
  const storyPct = Math.round((chapterNumber / story.targetChapters) * 100);

  const arcPosition = arc
    ? `Chapter ${arcPos} of ${arcLength} in this arc (${arcProgressPct}% through arc, ${storyPct}% through full story)`
    : "Arc assignment pending";

  // ── Emotional season ───────────────────────────────────────────
  const recentHookTypes = hookLog.map((h) => h.hookType);
  const { season, guidance } = deriveEmotionalSeason(chapterNumber, story.targetChapters, arcProgressPct, recentHookTypes);

  // ── Protagonist transformation stage ──────────────────────────
  const transformationStage = deriveTransformationStage(storyPct, story.targetChapters);

  // ── Character profiles ─────────────────────────────────────────
  const protagonist = characters.find((c) => c.role === "protagonist");
  const antagonist = characters.find((c) => c.role === "antagonist");
  const supportingCast = characters.filter((c) => c.role !== "protagonist" && c.role !== "antagonist");

  const keyCharacters = [
    protagonist
      ? [
          `PROTAGONIST — ${protagonist.name}:`,
          protagonist.physicalDesc ? `  Appearance: ${protagonist.physicalDesc}` : "",
          protagonist.wounds ? `  Core wound (drives every decision, often unconsciously): ${protagonist.wounds}` : "",
          protagonist.speechPatterns ? `  How they speak: ${protagonist.speechPatterns}` : "",
          protagonist.mannerisms ? `  Mannerisms: ${protagonist.mannerisms}` : "",
          protagonist.currentArc ? `  Where they are emotionally right now: ${protagonist.currentArc}` : "",
          protagonist.backstory ? `  Backstory that shapes them: ${protagonist.backstory.slice(0, 200)}` : "",
        ].filter(Boolean).join("\n")
      : "",
    antagonist
      ? [
          `\nANTAGONIST — ${antagonist.name}:`,
          antagonist.physicalDesc ? `  Appearance: ${antagonist.physicalDesc}` : "",
          antagonist.wounds ? `  Their wound/internal logic — they are not simply evil, they have a reason: ${antagonist.wounds}` : "",
          antagonist.speechPatterns ? `  How they speak: ${antagonist.speechPatterns}` : "",
          antagonist.currentArc ? `  Current position in story: ${antagonist.currentArc}` : "",
        ].filter(Boolean).join("\n")
      : "",
    ...supportingCast.slice(0, 5).map((c) =>
      [
        `\n${c.role.toUpperCase()} — ${c.name}:`,
        c.physicalDesc ? `  ${c.physicalDesc.slice(0, 80)}` : "",
        c.wounds ? `  Their wound/motivation: ${c.wounds}` : "",
        c.speechPatterns ? `  Voice pattern: ${c.speechPatterns}` : "",
        `  Last appeared: Ch.${c.lastSeenChapter}`,
      ].filter(Boolean).join("\n")
    ),
  ].filter(Boolean).join("\n");

  // ── Plot threads split into promises vs seeds ──────────────────
  const activePromises = extractActivePromises(plotThreads);
  const plantedSeeds = extractPlantedSeeds(
    plotThreads.map((t) => ({ ...t, lastMentionedChapter: t.lastMentionedChapter ?? 0 }))
  );

  const openThreads = plotThreads.length
    ? plotThreads
        .filter((t) => !t.description.includes("[SEED]"))
        .map((t) => `  • [Ch.${t.openedChapter}] ${t.title}: ${t.description}`)
        .join("\n") || "All threads are seeds — no active narrative promises yet."
    : "No open plot threads tracked yet.";

  // ── Hook history ───────────────────────────────────────────────
  const recentHooks = hookLog.length
    ? hookLog.map((h) => `Ch.${h.chapterNumber}[${h.hookType}]${h.hookSummary ? `:${h.hookSummary.slice(0, 50)}` : ""}`).join(" | ")
    : "No hook history yet.";

  // ── Recent chapter summaries (opening + closing, not full text) ─
  const recentChapterSummaries = recentChapters.length
    ? recentChapters
        .map((c) => {
          const sentences = c.content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
          const opening = sentences.slice(0, 3).join(". ").trim();
          const closing = sentences.slice(-3).join(". ").trim();
          return `CH.${c.chapterNumber} (${c.wordCount}w):\n  Opens: ${opening}...\n  Closes: ${closing}...`;
        })
        .join("\n\n")
    : "This is the opening chapter — no prior chapters exist. Establish voice, world, and protagonist wound immediately.";

  // ── Protagonist emotional state ────────────────────────────────
  const protagonistEmotionalState = protagonist?.currentArc
    ? protagonist.currentArc
    : arc
    ? `${arcProgressPct < 33 ? "Early arc — conflict establishing, energy and tension building" : arcProgressPct < 66 ? "Mid-arc — deep in the struggle, costs accumulating" : "Late arc — approaching breaking point, something must give"}`
    : "Emotional state unknown — ground the protagonist in specific feeling from the first sentence.";

  // ── Writer feedback — active unresolved notes ─────────────────
  const SEVERITY_LABEL: Record<string, string> = { high: "HIGH PRIORITY", medium: "MEDIUM", low: "NOTE" };
  const CATEGORY_LABEL: Record<string, string> = {
    voice: "Voice", pacing: "Pacing", character: "Character", plot: "Plot",
    hook: "Hook", emotion: "Emotion", dialogue: "Dialogue", structure: "Structure",
    rejection: "Rejection Reason", general: "General",
  };

  const storyPlotFeedback = feedbackNotes.filter((f) => f.scope !== "chapter");
  const chapterFeedback = feedbackNotes.filter(
    (f) => f.scope === "chapter" && f.chapterNumber !== null && f.chapterNumber >= chapterNumber - 10
  );

  let writerFeedback = "";
  if (!feedbackNotes.length) {
    writerFeedback = "No active correction notes — maintain current quality standards.";
  } else {
    if (storyPlotFeedback.length) {
      writerFeedback += "STORY & PLOT CORRECTIONS:\n";
      writerFeedback += storyPlotFeedback
        .map((f) => `• [${SEVERITY_LABEL[f.severity] ?? f.severity} — ${CATEGORY_LABEL[f.category] ?? f.category}] ${f.feedback}`)
        .join("\n");
    }
    if (chapterFeedback.length) {
      if (writerFeedback) writerFeedback += "\n\n";
      writerFeedback += "RECENT CHAPTER CORRECTIONS:\n";
      writerFeedback += chapterFeedback
        .map((f) => `• [${SEVERITY_LABEL[f.severity] ?? f.severity} — ${CATEGORY_LABEL[f.category] ?? f.category}${f.chapterNumber ? `, Ch.${f.chapterNumber}` : ""}] ${f.feedback}`)
        .join("\n");
    }
  }

  // ── Voice snippet — full, never truncated ─────────────────────
  const voiceSnippet = story.voiceProfile?.systemPromptSnippet
    ? `${story.voiceProfile.systemPromptSnippet}${
        story.voiceProfile.sampleText
          ? `\n\nWRITER'S OWN STYLE SAMPLE — this is the exact voice this story uses. Match every element: sentence rhythm, word-level diction, use of white space, interiority ratio, punctuation habits:\n"${story.voiceProfile.sampleText}"`
          : ""
      }`
    : "Write in a voice that is intimate, emotionally honest, and completely committed to the reader's experience. Every sentence earns its place or it doesn't exist.";

  // ── Voice anchor — actual chapter text as living proof of the voice ──
  // Chapter 1 is the canonical voice of this story. All subsequent chapters
  // must sound like they were written by the same hand on the same day.
  let voiceAnchor = "";

  if (chapterOne?.content) {
    const ch1Paragraphs = chapterOne.content
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40)
      .slice(0, 4)
      .join("\n\n");

    if (ch1Paragraphs) {
      voiceAnchor += `CHAPTER 1 — THE VOICE THIS STORY WAS BORN IN (every chapter must match this):\n"""\n${ch1Paragraphs}\n"""`;
    }
  }

  // Also anchor to the most recently approved chapter (continuity — reader just read this)
  const lastApproved = recentChapters[recentChapters.length - 1];
  if (lastApproved && lastApproved.chapterNumber > 1 && lastApproved.content) {
    const lastParas = lastApproved.content
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40)
      .slice(0, 2)
      .join("\n\n");

    if (lastParas) {
      if (voiceAnchor) voiceAnchor += "\n\n";
      voiceAnchor += `CHAPTER ${lastApproved.chapterNumber} — THE MOST RECENT CHAPTER (the reader just finished this; your chapter must flow seamlessly from this voice):\n"""\n${lastParas}\n"""`;
    }
  }

  if (!voiceAnchor) {
    voiceAnchor = chapterNumber === 1
      ? "This is Chapter 1 — you are establishing the voice. Make it count. Every subsequent chapter will be held to the standard you set here."
      : "No approved chapters yet to anchor against — write from the voice calibration above and commit to it completely.";
  }

  return {
    storyTitle: story.title,
    genre: `${story.genre}${story.subGenre ? ` / ${story.subGenre}` : ""}`,
    platform: {
      name: story.platform.name,
      paceProfile: story.platform.paceProfile,
      hookIntensity: story.platform.hookIntensity,
      targetChapterWords: story.platform.targetChapterWords,
    },
    voiceSnippet,
    arcName: arc?.name ?? "Story Opening",
    arcSummary: arc?.summary ?? "",
    arcEmotionalArc: arc?.emotionalArc ?? "",
    arcPosition,
    arcStartChapter: arcStart,
    arcEndChapter: arcEnd,
    arcProgressPct,
    protagonistEmotionalState,
    protagonistTransformationStage: transformationStage,
    emotionalSeason: season,
    emotionalSeasonGuidance: guidance,
    activePromises,
    plantedSeeds,
    outline: {
      chapterNumber,
      sceneSummary: outline?.sceneSummary ?? "Write a powerful scene that advances the protagonist's journey and deepens the central conflict.",
      location: outline?.location ?? "",
      emotionalBeat: outline?.emotionalBeat ?? "",
      revelations: outline?.revelations ?? "",
      withheld: outline?.withheld ?? "",
      hookType: outline?.hookType ?? "revelation",
      hookDescription: outline?.hookDescription ?? "",
      wordCountTarget: outline?.wordCountTarget ?? story.platform.targetChapterWords,
    },
    recentChapterSummaries,
    bibleSummary: bible?.summary ?? "Story bible not yet established — write with internal consistency.",
    keyCharacters: keyCharacters || "No character profiles yet — introduce characters with specificity, depth, and a revealed wound.",
    writerFeedback,
    voiceAnchor,
    openThreads,
    recentHooks,
  };
}
