"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

export default function SubmitPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = trpc.stories.byId.useQuery({ id: storyId });
  const { data: stats } = trpc.stories.stats.useQuery({ id: storyId });
  const [generating, setGenerating] = useState(false);
  const [pkg, setPkg] = useState<any>(null);
  const [error, setError] = useState("");
  const updateStory = trpc.stories.update.useMutation();

  async function generatePackage() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/generate-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPkg(data);
      updateStory.mutate({ id: storyId, data: { submissionPackage: JSON.stringify(data) } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  const savedPkg = story?.submissionPackage ? JSON.parse(story.submissionPackage) : null;
  const displayPkg = pkg ?? savedPkg;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-sm text-gray-500 mb-1">
          <Link href={`/stories/${storyId}`} className="hover:text-gray-300">← {story?.title}</Link>
        </div>
        <h1 className="text-2xl font-bold text-white">Submission Package</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-ready titles, synopsis, and formatting for {story?.platform?.name}</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 grid grid-cols-3 gap-4">
          <div>
            <div className="text-xl font-bold text-white">{stats.chaptersWritten}</div>
            <div className="text-xs text-gray-500">Chapters written</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{Math.round((stats.totalWords ?? 0) / 1000)}K</div>
            <div className="text-xs text-gray-500">Total words</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${stats.completionPct >= 100 ? "text-green-400" : "text-amber-400"}`}>{stats.completionPct}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>
      )}

      {error && <div className="rounded-lg bg-red-950 border border-red-800 text-red-300 px-4 py-3 text-sm">{error}</div>}

      <button
        onClick={generatePackage}
        disabled={generating}
        className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors"
      >
        {generating ? "Building Package…" : displayPkg ? "Regenerate Package" : "Generate Submission Package"}
      </button>

      {displayPkg && (
        <div className="space-y-5">
          {/* Titles */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Title Options</h2>
            <div className="space-y-2">
              {displayPkg.titles?.map((t: { title: string; rationale: string }, i: number) => (
                <div key={i} className="rounded-lg border border-gray-700 p-3 space-y-1">
                  <div className="font-semibold text-white">{t.title}</div>
                  <div className="text-xs text-gray-500">{t.rationale}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Platform Synopsis</h2>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{displayPkg.synopsis}</p>
          </div>

          {/* Tags */}
          {displayPkg.tags && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recommended Tags</h2>
              <div className="flex flex-wrap gap-2">
                {displayPkg.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-sm">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Platform notes */}
          {displayPkg.platformNotes && (
            <div className="rounded-xl border border-amber-900 bg-amber-950/10 p-5 space-y-2">
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Submission Notes</h2>
              <p className="text-sm text-amber-200/70 leading-relaxed">{displayPkg.platformNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
