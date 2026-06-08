"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const NAV_ITEMS = [
  { href: (id: string) => `/stories/${id}/voice`, icon: "◎", label: "Voice Calibration", desc: "Set your writing style — AI protects it through all 200 chapters" },
  { href: (id: string) => `/stories/${id}/arcs`, icon: "◈", label: "Arc Structure", desc: "Build your multi-arc plot architecture" },
  { href: (id: string) => `/stories/${id}/outline`, icon: "☰", label: "Chapter Outline", desc: "Full chapter-by-chapter story plan" },
  { href: (id: string) => `/stories/${id}/bible`, icon: "◉", label: "Story Bible", desc: "Characters, threads, world elements" },
  { href: (id: string) => `/stories/${id}/translate`, icon: "⟐", label: "Translation Studio", desc: "Translate to 40+ languages — exact story, different language" },
  { href: (id: string) => `/stories/${id}/feedback`, icon: "✗", label: "Feedback & Corrections", desc: "Log what needs fixing — AI uses every note in the next generation" },
  { href: (id: string) => `/stories/${id}/submit`, icon: "↑", label: "Submission Package", desc: "Titles, synopsis, platform formatting" },
];

const HOOK_LABELS: Record<string, string> = {
  revelation: "Revelation",
  confrontation: "Confrontation",
  "gut-punch": "Gut-punch",
  danger: "Danger",
  mystery: "Mystery",
  arrival: "Arrival",
};

function daysSince(date: string | Date | null): string {
  if (!date) return "";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function StoryDashboardPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = trpc.stories.byId.useQuery({ id: storyId });
  const { data: stats } = trpc.stories.stats.useQuery({ id: storyId });
  const { data: resume } = trpc.stories.resumeContext.useQuery({ id: storyId });
  const { data: feedbackCount } = trpc.feedback.activeCount.useQuery({ storyId });

  if (!story) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pct = stats ? Math.round((stats.chaptersWritten / story.targetChapters) * 100) : 0;
  const nextChapter = resume?.nextChapterNumber ?? 1;
  const isNewStory = !resume?.lastChapterNumber;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/stories" className="hover:text-gray-300">Stories</Link>
            <span>/</span>
            <span className="text-gray-300">{story.title}</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{story.title}</h1>
          <p className="text-gray-400">{story.genre}{story.subGenre ? ` · ${story.subGenre}` : ""} · {story.platform.name}</p>
        </div>
        <div className="shrink-0">
          <Link
            href={`/stories/${storyId}/write/${nextChapter}`}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors block text-center"
          >
            {isNewStory ? "Start Writing" : `Continue — Ch. ${nextChapter}`}
          </Link>
        </div>
      </div>

      {/* WHERE YOU LEFT OFF — only shown when there's at least 1 approved chapter */}
      {resume && resume.lastChapterNumber > 0 && (
        <div className="rounded-xl border border-violet-900 bg-violet-950/20 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-violet-300 uppercase tracking-wider">Where You Left Off</h2>
            {resume.daysSince !== null && (
              <span className="text-xs text-gray-500">
                Last session: {daysSince(resume.lastSessionAt)}
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Last chapter closing */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Chapter {resume.lastChapterNumber} ended with</span>
                {resume.lastHookType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900 text-violet-300 font-medium">
                    {HOOK_LABELS[resume.lastHookType] ?? resume.lastHookType}
                  </span>
                )}
              </div>
              {resume.closingLines ? (
                <blockquote className="text-sm text-gray-300 italic leading-relaxed border-l-2 border-violet-800 pl-3">
                  {resume.closingLines.length > 280
                    ? `…${resume.closingLines.slice(-280)}`
                    : resume.closingLines}
                </blockquote>
              ) : (
                <p className="text-sm text-gray-500">No closing lines recorded.</p>
              )}
            </div>

            {/* What's coming next */}
            <div className="space-y-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Chapter {resume.nextChapterNumber} — Next to write
              </span>
              {resume.nextOutline ? (
                <div className="space-y-2">
                  {resume.nextOutline.arcName && (
                    <p className="text-xs text-violet-400">Arc: {resume.nextOutline.arcName}</p>
                  )}
                  <p className="text-sm text-gray-300 leading-relaxed">{resume.nextOutline.sceneSummary}</p>
                  {resume.nextOutline.emotionalBeat && (
                    <p className="text-xs text-gray-500">Reader must feel: {resume.nextOutline.emotionalBeat}</p>
                  )}
                  {resume.nextOutline.hookType && (
                    <p className="text-xs text-gray-600">Closing hook: <span className="text-violet-400">{HOOK_LABELS[resume.nextOutline.hookType] ?? resume.nextOutline.hookType}</span></p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No outline yet for Ch. {resume.nextChapterNumber} — generate your arc outlines first.</p>
              )}
            </div>
          </div>

          {/* Active promises — what the reader is waiting for */}
          {resume.activeThreads.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-violet-900/50">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Active promises to the reader</span>
              <div className="flex flex-wrap gap-2">
                {resume.activeThreads.map((t, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                    {t.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Protagonist state */}
          {resume.protagonistState && (
            <div className="space-y-1 pt-2 border-t border-violet-900/50">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                {resume.protagonistName ? `${resume.protagonistName}'s current state` : "Protagonist state"}
              </span>
              <p className="text-sm text-gray-400 leading-relaxed">{resume.protagonistState}</p>
            </div>
          )}

          <Link
            href={`/stories/${storyId}/write/${resume.nextChapterNumber}`}
            className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors text-sm"
          >
            Write Chapter {resume.nextChapterNumber} →
          </Link>
        </div>
      )}

      {/* Progress */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Production Progress</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Chapters Written", value: stats?.chaptersWritten ?? 0 },
            { label: "Target Chapters", value: story.targetChapters },
            { label: "Total Words", value: stats ? `${Math.round(stats.totalWords / 1000)}K` : "0K" },
            { label: "Completion", value: `${pct}%` },
          ].map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
          <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Navigation */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Write Chapters — uses nextChapter, not hardcoded 1 */}
        <Link
          href={`/stories/${storyId}/write/${nextChapter}`}
          className="flex items-start gap-4 p-5 rounded-xl border border-gray-800 bg-gray-900 hover:border-violet-700 hover:bg-gray-800 transition-all"
        >
          <span className="text-2xl text-violet-400 shrink-0">✎</span>
          <div>
            <div className="font-semibold text-white">Write Chapters</div>
            <div className="text-sm text-gray-400 mt-0.5">
              {isNewStory ? "Begin Chapter 1" : `Resume at Chapter ${nextChapter}`}
            </div>
          </div>
        </Link>

        {NAV_ITEMS.map((item) => {
          const isFeedback = item.label === "Feedback & Corrections";
          const hasPendingFeedback = isFeedback && feedbackCount && feedbackCount > 0;
          return (
            <Link
              key={item.label}
              href={item.href(storyId)}
              className={`flex items-start gap-4 p-5 rounded-xl border transition-all ${hasPendingFeedback ? "border-red-900 bg-red-950/20 hover:border-red-700" : "border-gray-800 bg-gray-900 hover:border-violet-700 hover:bg-gray-800"}`}
            >
              <span className="text-2xl text-violet-400 shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{item.label}</span>
                  {hasPendingFeedback && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-900 text-red-300 font-medium shrink-0">
                      {feedbackCount} active
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-0.5">{item.desc}</div>
              </div>
            </Link>
          );
        })}

        {story.writerMode === "typeA" && (
          <Link
            href={`/stories/${storyId}/arcs`}
            className="flex items-start gap-4 p-5 rounded-xl border border-violet-900 bg-violet-950/30 hover:border-violet-700 transition-all"
          >
            <span className="text-2xl text-violet-400 shrink-0">★</span>
            <div>
              <div className="font-semibold text-white">Generate Ideas</div>
              <div className="text-sm text-violet-300 mt-0.5">AI-powered concept engine for your genre</div>
            </div>
          </Link>
        )}
      </div>

      {/* Platform notes */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{story.platform.name} Platform Notes</h2>
        <p className="text-sm text-gray-400 leading-relaxed">{story.platform.submissionNotes}</p>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
          <span>Min words/chapter: <span className="text-gray-300">{story.platform.minChapterWords.toLocaleString()}</span></span>
          <span>Target words/chapter: <span className="text-gray-300">{story.platform.targetChapterWords.toLocaleString()}</span></span>
          <span>Pace: <span className="text-gray-300">{story.platform.paceProfile}</span></span>
          <span>Hook intensity: <span className="text-gray-300">{story.platform.hookIntensity}</span></span>
        </div>
      </div>
    </div>
  );
}
