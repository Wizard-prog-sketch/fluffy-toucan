import "dotenv/config";
import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.error("❌  DATABASE_URL must be a Turso libsql:// URL. Check your .env file.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS "Platform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "minChapterWords" INTEGER NOT NULL DEFAULT 1000,
    "targetChapterWords" INTEGER NOT NULL DEFAULT 1200,
    "maxChapterWords" INTEGER NOT NULL DEFAULT 2000,
    "minChapters" INTEGER NOT NULL DEFAULT 100,
    "contentRating" TEXT NOT NULL DEFAULT 'PG-13',
    "allowedGenres" TEXT NOT NULL DEFAULT '[]',
    "paceProfile" TEXT NOT NULL DEFAULT 'fast-open',
    "hookIntensity" TEXT NOT NULL DEFAULT 'high',
    "submissionNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Platform_name_key" ON "Platform"("name")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Platform_slug_key" ON "Platform"("slug")`,

  `CREATE TABLE IF NOT EXISTS "Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "genre" TEXT NOT NULL,
    "subGenre" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'drafting',
    "writerMode" TEXT NOT NULL DEFAULT 'typeA',
    "targetChapters" INTEGER NOT NULL DEFAULT 200,
    "platformId" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL DEFAULT '',
    "submissionPackage" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "IdeaCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT,
    "genre" TEXT NOT NULL,
    "premise" TEXT NOT NULL,
    "emotionalHook" TEXT NOT NULL,
    "centralConflict" TEXT NOT NULL,
    "protagonistWound" TEXT NOT NULL,
    "longRunwayScore" INTEGER NOT NULL DEFAULT 0,
    "viabilityNotes" TEXT NOT NULL DEFAULT '',
    "selected" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "VoiceProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "writingStyle" TEXT NOT NULL DEFAULT 'cinematic',
    "dialogueIntensity" TEXT NOT NULL DEFAULT 'medium',
    "descriptionDensity" TEXT NOT NULL DEFAULT 'medium',
    "toneRegister" TEXT NOT NULL DEFAULT 'intense',
    "sampleText" TEXT NOT NULL DEFAULT '',
    "systemPromptSnippet" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VoiceProfile_storyId_key" ON "VoiceProfile"("storyId")`,

  `CREATE TABLE IF NOT EXISTS "Arc" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "emotionalArc" TEXT NOT NULL DEFAULT '',
    "startChapter" INTEGER NOT NULL,
    "endChapter" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "ChapterOutline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "arcId" TEXT,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "sceneSummary" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "charactersPresent" TEXT NOT NULL DEFAULT '',
    "emotionalBeat" TEXT NOT NULL DEFAULT '',
    "revelations" TEXT NOT NULL DEFAULT '',
    "withheld" TEXT NOT NULL DEFAULT '',
    "arcAdvancement" TEXT NOT NULL DEFAULT '',
    "hookType" TEXT NOT NULL DEFAULT '',
    "hookDescription" TEXT NOT NULL DEFAULT '',
    "wordCountTarget" INTEGER NOT NULL DEFAULT 1200,
    "approved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ChapterOutline_storyId_chapterNumber_key" ON "ChapterOutline"("storyId","chapterNumber")`,

  `CREATE TABLE IF NOT EXISTS "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "outlineId" TEXT,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "revisionNotes" TEXT NOT NULL DEFAULT '',
    "consistencyFlags" TEXT NOT NULL DEFAULT '[]',
    "hookScore" INTEGER NOT NULL DEFAULT 0,
    "hookType" TEXT NOT NULL DEFAULT '',
    "generationMeta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Chapter_outlineId_key" ON "Chapter"("outlineId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Chapter_storyId_chapterNumber_key" ON "Chapter"("storyId","chapterNumber")`,

  `CREATE TABLE IF NOT EXISTS "ChapterTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'English',
    "targetLanguage" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ChapterTranslation_chapterId_targetLanguage_key" ON "ChapterTranslation"("chapterId","targetLanguage")`,
  `CREATE INDEX IF NOT EXISTS "ChapterTranslation_storyId_targetLanguage_idx" ON "ChapterTranslation"("storyId","targetLanguage")`,

  `CREATE TABLE IF NOT EXISTS "StoryBible" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "lastUpdatedChapter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "StoryBible_storyId_key" ON "StoryBible"("storyId")`,

  `CREATE TABLE IF NOT EXISTS "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'supporting',
    "physicalDesc" TEXT NOT NULL DEFAULT '',
    "speechPatterns" TEXT NOT NULL DEFAULT '',
    "mannerisms" TEXT NOT NULL DEFAULT '',
    "backstory" TEXT NOT NULL DEFAULT '',
    "wounds" TEXT NOT NULL DEFAULT '',
    "currentArc" TEXT NOT NULL DEFAULT '',
    "introducedChapter" INTEGER NOT NULL DEFAULT 1,
    "lastSeenChapter" INTEGER NOT NULL DEFAULT 1,
    "statusHistory" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "CharacterRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromCharId" TEXT NOT NULL,
    "toCharId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL DEFAULT 'neutral',
    "currentState" TEXT NOT NULL DEFAULT '',
    "history" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "PlotThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "openedChapter" INTEGER NOT NULL,
    "resolvedChapter" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "lastMentionedChapter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "WorldElement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'location',
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "firstMentionedChapter" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "HookLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "hookType" TEXT NOT NULL,
    "hookSummary" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "StoryFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'story',
    "chapterNumber" INTEGER,
    "category" TEXT NOT NULL DEFAULT 'general',
    "feedback" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "resolved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "StoryFeedback_storyId_resolved_idx" ON "StoryFeedback"("storyId","resolved")`,

  `CREATE TABLE IF NOT EXISTS "WritingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "chaptersWritten" INTEGER NOT NULL DEFAULT 0,
    "wordsProduced" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "sessionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

const PLATFORMS = [
  {
    name: "GoodNovel", slug: "goodnovel",
    minChapterWords: 1000, targetChapterWords: 1200, maxChapterWords: 2000, minChapters: 100,
    contentRating: "PG-13",
    allowedGenres: JSON.stringify(["Romance", "Urban", "Fantasy", "Werewolf", "CEO/Billionaire", "Revenge", "Paranormal"]),
    paceProfile: "fast-open", hookIntensity: "high",
    submissionNotes: "Strong chapter hooks required. Romance and urban fiction dominate. First 10 chapters must establish the central conflict and relationship tension clearly.",
  },
  {
    name: "WebNovel", slug: "webnovel",
    minChapterWords: 1000, targetChapterWords: 1500, maxChapterWords: 3000, minChapters: 200,
    contentRating: "PG-13",
    allowedGenres: JSON.stringify(["Fantasy", "Eastern Fantasy", "Sci-fi", "Romance", "Action", "Martial Arts", "System", "Isekai"]),
    paceProfile: "fast-open", hookIntensity: "very-high",
    submissionNotes: "Power progression systems are strongly favored. Each chapter should end with a strong revelation or power moment.",
  },
  {
    name: "Dreame", slug: "dreame",
    minChapterWords: 1000, targetChapterWords: 1200, maxChapterWords: 2000, minChapters: 100,
    contentRating: "R",
    allowedGenres: JSON.stringify(["Romance", "Werewolf", "Mafia", "Billionaire", "Forbidden Love", "Revenge", "Dark Romance"]),
    paceProfile: "fast-open", hookIntensity: "high",
    submissionNotes: "Dreame readers expect emotional intensity from the opening chapter. Dark romance and forbidden relationships perform especially well.",
  },
  {
    name: "Pocket FM", slug: "pocket-fm",
    minChapterWords: 800, targetChapterWords: 1000, maxChapterWords: 1500, minChapters: 200,
    contentRating: "PG-13",
    allowedGenres: JSON.stringify(["Romance", "Drama", "Thriller", "Family", "Revenge", "Second Chance"]),
    paceProfile: "fast-open", hookIntensity: "very-high",
    submissionNotes: "Pocket FM is audio-first — chapters must be written to sound natural when read aloud. Short, punchy sentences. Every chapter must end on a compelling cliffhanger or revelation.",
  },
  {
    name: "Inkitt / Galatea", slug: "galatea",
    minChapterWords: 1000, targetChapterWords: 1300, maxChapterWords: 2500, minChapters: 80,
    contentRating: "R",
    allowedGenres: JSON.stringify(["Werewolf", "Paranormal Romance", "Fantasy Romance", "Dark Romance", "Billionaire"]),
    paceProfile: "slow-burn", hookIntensity: "medium",
    submissionNotes: "Galatea readers appreciate deeper world-building and slower romantic tension builds. Quality of prose is weighted more than raw hook intensity.",
  },
  {
    name: "NovelSnack", slug: "novelsnack",
    minChapterWords: 800, targetChapterWords: 1000, maxChapterWords: 1500, minChapters: 100,
    contentRating: "PG-13",
    allowedGenres: JSON.stringify(["Romance", "CEO/Billionaire", "Werewolf", "Mafia", "Revenge", "Forbidden Love", "Second Chance", "Paranormal"]),
    paceProfile: "fast-open", hookIntensity: "very-high",
    submissionNotes: "NovelSnack is built for snackable fiction — short chapters readers consume in under 5 minutes. Every chapter must hook immediately and end on a cliffhanger that forces the next tap.",
  },
  {
    name: "MoboReader", slug: "moboreader",
    minChapterWords: 1000, targetChapterWords: 1500, maxChapterWords: 3000, minChapters: 100,
    contentRating: "PG-13",
    allowedGenres: JSON.stringify(["Romance", "Urban", "Fantasy", "Werewolf", "CEO/Billionaire", "Action", "Revenge", "Paranormal"]),
    paceProfile: "fast-open", hookIntensity: "high",
    submissionNotes: "MoboReader operates globally across multiple languages and regions. Stories must hook readers within the first 3 chapters. Fast escalation of the central conflict is expected.",
  },
  {
    name: "iStory", slug: "istory",
    minChapterWords: 800, targetChapterWords: 1000, maxChapterWords: 1500, minChapters: 80,
    contentRating: "PG-13",
    allowedGenres: JSON.stringify(["Romance", "Drama", "Mystery", "Thriller", "Family", "Revenge", "Second Chance"]),
    paceProfile: "fast-open", hookIntensity: "high",
    submissionNotes: "iStory favors emotionally immediate, character-driven storytelling. Chapters must open mid-emotion — readers expect to feel something within the first paragraph.",
  },
  {
    name: "Ringdom", slug: "ringdom",
    minChapterWords: 1000, targetChapterWords: 1200, maxChapterWords: 2000, minChapters: 100,
    contentRating: "PG-13",
    allowedGenres: JSON.stringify(["Romance", "Fantasy", "Werewolf", "CEO/Billionaire", "Revenge", "Urban", "Paranormal", "Forbidden Love"]),
    paceProfile: "fast-open", hookIntensity: "high",
    submissionNotes: "Ringdom readers expect consistent emotional tension and powerful romantic chemistry from the opening chapter. Werewolf, billionaire, and revenge romance perform especially well.",
  },
  {
    name: "MegaNovel", slug: "meganovel",
    minChapterWords: 1000, targetChapterWords: 1200, maxChapterWords: 2000, minChapters: 100,
    contentRating: "PG-13",
    allowedGenres: JSON.stringify(["Romance", "Fantasy", "Action", "Urban", "Werewolf", "CEO/Billionaire", "Revenge", "Sci-fi"]),
    paceProfile: "fast-open", hookIntensity: "high",
    submissionNotes: "MegaNovel emphasizes fast romantic escalation, strong leads, and chapter-ending hooks. The first 10 chapters must establish the protagonist's core wound and central conflict clearly.",
  },
  {
    name: "LetterLux", slug: "letterlux",
    minChapterWords: 1000, targetChapterWords: 1300, maxChapterWords: 2000, minChapters: 80,
    contentRating: "PG-13",
    allowedGenres: JSON.stringify(["Romance", "Drama", "Thriller", "Fantasy", "Mystery", "Literary Fiction", "Second Chance"]),
    paceProfile: "balanced", hookIntensity: "medium",
    submissionNotes: "LetterLux rewards prose quality alongside compelling hooks. Strong character interiority and layered dialogue are valued. Central emotional conflict should be established by chapter 3.",
  },
  {
    name: "Stary Writing", slug: "stary-writing",
    minChapterWords: 1000, targetChapterWords: 1200, maxChapterWords: 2000, minChapters: 100,
    contentRating: "PG-13",
    allowedGenres: JSON.stringify(["Romance", "Fantasy", "Drama", "Werewolf", "CEO/Billionaire", "Paranormal", "Forbidden Love", "Dark Romance"]),
    paceProfile: "fast-open", hookIntensity: "high",
    submissionNotes: "Stary Writing is mobile-first with a young, highly engaged reader base. Chapter hooks must be emotionally immediate — the reader must feel the pull within the first paragraph.",
  },
];

async function run() {
  console.log("🔗 Connecting to Turso:", url);

  // Create all tables
  console.log("\n📋 Creating tables...");
  for (const sql of TABLES) {
    const tableName = sql.match(/TABLE.*?"(\w+)"/)?.[1] ?? sql.match(/INDEX.*?"(\w+)"/)?.[1] ?? "?";
    try {
      await client.execute(sql);
      console.log("  ✓", tableName);
    } catch (e: any) {
      console.error("  ✗", tableName, "-", e.message);
      throw e;
    }
  }

  // Seed platforms
  console.log("\n🌱 Seeding platforms...");
  for (const p of PLATFORMS) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO "Platform" (id, name, slug, minChapterWords, targetChapterWords, maxChapterWords, minChapters, contentRating, allowedGenres, paceProfile, hookIntensity, submissionNotes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), p.name, p.slug, p.minChapterWords, p.targetChapterWords, p.maxChapterWords, p.minChapters, p.contentRating, p.allowedGenres, p.paceProfile, p.hookIntensity, p.submissionNotes],
    });
    console.log("  ✓", p.name);
  }

  console.log("\n✅ Turso database ready! Tables created and platforms seeded.");
  client.close();
}

run().catch((e) => {
  console.error("\n❌ Setup failed:", e.message);
  process.exit(1);
});
