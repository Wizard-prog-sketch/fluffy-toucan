import { router } from "../server";
import { platformsRouter } from "./platforms";
import { storiesRouter } from "./stories";
import { arcsRouter } from "./arcs";
import { outlinesRouter } from "./outlines";
import { chaptersRouter } from "./chapters";
import { bibleRouter } from "./bible";
import { voiceRouter } from "./voice";
import { translationRouter } from "./translation";
import { feedbackRouter } from "./feedback";

export const appRouter = router({
  platforms: platformsRouter,
  stories: storiesRouter,
  arcs: arcsRouter,
  outlines: outlinesRouter,
  chapters: chaptersRouter,
  bible: bibleRouter,
  voice: voiceRouter,
  translation: translationRouter,
  feedback: feedbackRouter,
});

export type AppRouter = typeof appRouter;
