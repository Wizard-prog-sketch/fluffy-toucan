"use client";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

const STATUS_COLOR: Record<string, string> = {
  idea: "bg-gray-700 text-gray-300",
  drafting: "bg-yellow-900 text-yellow-300",
  writing: "bg-violet-900 text-violet-300",
  complete: "bg-green-900 text-green-300",
  submitted: "bg-blue-900 text-blue-300",
};

function daysSince(date: string | Date | null): string {
  if (!date) return "Never written";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function StoriesPage() {
  const { data: stories, isLoading } = trpc.stories.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stories?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <div className="text-5xl">✦</div>
        <h2 className="text-2xl font-bold text-white">No stories yet</h2>
        <p className="text-gray-400">Start your first 200-chapter journey.</p>
        <Link href="/stories/new" className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors">
          Create Your First Story
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Stories</h1>
          <p className="text-gray-400 text-sm mt-1">{stories.length} {stories.length === 1 ? "story" : "stories"} in production</p>
        </div>
        <Link href="/stories/new" className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors">
          + New Story
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => {
          const chaptersWritten = story._count.chapters;
          const pct = Math.round((chaptersWritten / story.targetChapters) * 100);
          const lastChapterNum = story.chapters[0]?.chapterNumber ?? 0;
          const nextChapterNum = lastChapterNum + 1;
          const lastSession = story.writingSessions[0]?.sessionDate ?? null;

          return (
            <div key={story.id} className="rounded-xl border border-gray-800 bg-gray-900 hover:border-gray-700 transition-all p-5 space-y-4 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <Link href={`/stories/${story.id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white leading-tight hover:text-violet-300 transition-colors">{story.title}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{story.genre} · {story.platform.name}</p>
                </Link>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[story.status] ?? "bg-gray-700 text-gray-300"}`}>
                  {story.status}
                </span>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Ch. {chaptersWritten} / {story.targetChapters}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Last active */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {lastChapterNum > 0
                    ? `Last wrote Ch. ${lastChapterNum}`
                    : "Not started yet"}
                </span>
                <span>{daysSince(lastSession)}</span>
              </div>

              {/* Resume CTA */}
              <div className="mt-auto pt-1">
                <Link
                  href={`/stories/${story.id}/write/${nextChapterNum}`}
                  className="block w-full text-center py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold transition-colors"
                >
                  {lastChapterNum === 0 ? "Start Writing →" : `Continue — Ch. ${nextChapterNum} →`}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
