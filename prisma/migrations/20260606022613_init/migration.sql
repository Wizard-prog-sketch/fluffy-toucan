-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "minChapterWords" INTEGER NOT NULL DEFAULT 1000,
    "targetChapterWords" INTEGER NOT NULL DEFAULT 1200,
    "maxChapterWords" INTEGER NOT NULL DEFAULT 2000,
    "minChapters" INTEGER NOT NULL DEFAULT 100,
    "contentRating" TEXT NOT NULL DEFAULT 'PG-13',
    "allowedGenres" TEXT NOT NULL,
    "paceProfile" TEXT NOT NULL DEFAULT 'fast-open',
    "hookIntensity" TEXT NOT NULL DEFAULT 'high',
    "submissionNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Story" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Story_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdeaCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT,
    "genre" TEXT NOT NULL,
    "premise" TEXT NOT NULL,
    "emotionalHook" TEXT NOT NULL,
    "centralConflict" TEXT NOT NULL,
    "protagonistWound" TEXT NOT NULL,
    "longRunwayScore" INTEGER NOT NULL DEFAULT 0,
    "viabilityNotes" TEXT NOT NULL DEFAULT '',
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdeaCandidate_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoiceProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "writingStyle" TEXT NOT NULL DEFAULT 'cinematic',
    "dialogueIntensity" TEXT NOT NULL DEFAULT 'medium',
    "descriptionDensity" TEXT NOT NULL DEFAULT 'medium',
    "toneRegister" TEXT NOT NULL DEFAULT 'intense',
    "sampleText" TEXT NOT NULL DEFAULT '',
    "systemPromptSnippet" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VoiceProfile_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Arc" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Arc_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChapterOutline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "arcId" TEXT,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "sceneSummary" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "charactersPresent" TEXT NOT NULL DEFAULT '',
    "emotionalBeat" TEXT NOT NULL DEFAULT '',
    "revelations" TEXT NOT NULL DEFAULT '',
    "withheld" TEXT NOT NULL DEFAULT '',
    "arcAdvancement" TEXT NOT NULL DEFAULT '',
    "hookType" TEXT NOT NULL DEFAULT '',
    "hookDescription" TEXT NOT NULL DEFAULT '',
    "wordCountTarget" INTEGER NOT NULL DEFAULT 1200,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChapterOutline_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChapterOutline_arcId_fkey" FOREIGN KEY ("arcId") REFERENCES "Arc" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chapter" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Chapter_outlineId_fkey" FOREIGN KEY ("outlineId") REFERENCES "ChapterOutline" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryBible" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "lastUpdatedChapter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryBible_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Character" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromCharId" TEXT NOT NULL,
    "toCharId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL DEFAULT 'neutral',
    "currentState" TEXT NOT NULL DEFAULT '',
    "history" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterRelationship_fromCharId_fkey" FOREIGN KEY ("fromCharId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterRelationship_toCharId_fkey" FOREIGN KEY ("toCharId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlotThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "openedChapter" INTEGER NOT NULL,
    "resolvedChapter" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "lastMentionedChapter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlotThread_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorldElement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'location',
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "firstMentionedChapter" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorldElement_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HookLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "hookType" TEXT NOT NULL,
    "hookSummary" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HookLog_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WritingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "chaptersWritten" INTEGER NOT NULL DEFAULT 0,
    "wordsProduced" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "sessionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WritingSession_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Platform_name_key" ON "Platform"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_slug_key" ON "Platform"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceProfile_storyId_key" ON "VoiceProfile"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterOutline_storyId_chapterNumber_key" ON "ChapterOutline"("storyId", "chapterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_outlineId_key" ON "Chapter"("outlineId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_storyId_chapterNumber_key" ON "Chapter"("storyId", "chapterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StoryBible_storyId_key" ON "StoryBible"("storyId");
