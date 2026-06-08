"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

export default function ArcsPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = trpc.stories.byId.useQuery({ id: storyId });
  const { data: arcs, refetch } = trpc.arcs.byStory.useQuery({ storyId });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function generateArcs() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/generate-arcs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refetch();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href={`/stories/${storyId}`} className="hover:text-gray-300">← {story?.title}</Link>
          </div>
          <h1 className="text-2xl font-bold text-white">Arc Structure</h1>
          <p className="text-gray-400 text-sm mt-1">Multi-arc plot architecture for {story?.targetChapters} chapters</p>
        </div>
        <div className="flex gap-3">
          {arcs && arcs.length > 0 && (
            <Link
              href={`/stories/${storyId}/outline`}
              className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
              Build Outlines →
            </Link>
          )}
          <button
            onClick={generateArcs}
            disabled={generating}
            className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium text-sm transition-colors"
          >
            {generating ? "Generating…" : arcs?.length ? "Regenerate Arcs" : "Generate Arc Structure"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950 border border-red-800 text-red-300 px-4 py-3 text-sm">{error}</div>
      )}

      {generating && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Building your story arc structure…</p>
          <p className="text-xs text-gray-600">This takes ~15 seconds</p>
        </div>
      )}

      {!generating && arcs?.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center space-y-3">
          <div className="text-4xl text-gray-700">◈</div>
          <p className="text-gray-400">No arcs yet. Generate your multi-arc structure to get started.</p>
        </div>
      )}

      {!generating && arcs && arcs.length > 0 && (
        <div className="space-y-3">
          {arcs.map((arc, i) => (
            <div key={arc.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-violet-900 text-violet-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-white">{arc.name}</h3>
                    <p className="text-xs text-gray-500">Ch. {arc.startChapter}–{arc.endChapter} · {arc.endChapter - arc.startChapter + 1} chapters · {arc._count.chapterOutlines} outlines</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${arc.status === "complete" ? "bg-green-900 text-green-300" : arc.status === "writing" ? "bg-violet-900 text-violet-300" : "bg-gray-800 text-gray-400"}`}>
                  {arc.status}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{arc.summary}</p>
              {arc.emotionalArc && (
                <p className="text-xs text-gray-500 italic border-l-2 border-violet-800 pl-3">{arc.emotionalArc}</p>
              )}
              {arc._count.chapterOutlines === 0 && (
                <GenerateOutlinesButton storyId={storyId} arcId={arc.id} arcName={arc.name} onDone={refetch} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GenerateOutlinesButton({ storyId, arcId, arcName, onDone }: { storyId: string; arcId: string; arcName: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      await fetch("/api/ai/generate-outlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, arcId }),
      });
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50 transition-colors"
    >
      {loading ? "Building outlines…" : `+ Generate chapter outlines for ${arcName}`}
    </button>
  );
}
