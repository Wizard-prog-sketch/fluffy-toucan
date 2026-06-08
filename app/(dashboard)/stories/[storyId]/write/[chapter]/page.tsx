"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const HOOK_LABELS: Record<string, string> = {
  revelation: "Revelation",
  confrontation: "Confrontation",
  "gut-punch": "Gut-punch",
  danger: "Danger",
  mystery: "Mystery",
  arrival: "Arrival",
};

export default function WriteChapterPage() {
  const { storyId, chapter } = useParams<{ storyId: string; chapter: string }>();
  const chapterNum = Number(chapter);

  const { data: story } = trpc.stories.byId.useQuery({ id: storyId });
  const { data: chapterData, refetch } = trpc.chapters.byNumber.useQuery({ storyId, chapterNumber: chapterNum });
  const { data: outline } = trpc.outlines.byChapter.useQuery({ storyId, chapterNumber: chapterNum });
  const { data: resume } = trpc.stories.resumeContext.useQuery({ id: storyId });
  const updateStatus = trpc.chapters.updateStatus.useMutation({ onSuccess: () => refetch() });

  const [content, setContent] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [stateOpen, setStateOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chapterData?.content) setContent(chapterData.content);
  }, [chapterData]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const minWords = story?.platform?.minChapterWords ?? 1000;
  const meetsMinimum = wordCount >= minWords;

  const isFirstChapter = chapterNum === 1;
  const prevChapterClosed = resume?.lastChapterNumber !== undefined
    ? resume.lastChapterNumber >= chapterNum - 1
    : true;

  async function generateChapter() {
    setStreaming(true);
    setError("");
    setContent("");
    setMode("view");

    try {
      const res = await fetch("/api/ai/generate-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, chapterNumber: chapterNum }),
      });

      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setContent(accumulated);
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      }

      await refetch();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStreaming(false);
    }
  }

  async function approveChapter() {
    if (!chapterData) return;
    updateStatus.mutate({ id: chapterData.id, status: "approved" });
  }

  async function requestRevision() {
    if (!chapterData) return;
    updateStatus.mutate({ id: chapterData.id, status: "revised", revisionNotes: revisionNote });
  }

  const paragraphs = content.split(/\n+/).filter((p) => p.trim());

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="sticky top-14 z-30 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/stories/${storyId}`} className="text-gray-500 hover:text-gray-300">← {story?.title ?? "Story"}</Link>
            <span className="text-gray-700">/</span>
            <span className="text-white font-medium">Chapter {chapterNum}</span>
            {outline?.title && <span className="text-gray-500 hidden sm:block">· {outline.title}</span>}
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono ${meetsMinimum ? "text-green-400" : "text-amber-400"}`}>
              {wordCount.toLocaleString()} words
            </span>
            {!meetsMinimum && <span className="text-xs text-amber-600">(min {minWords.toLocaleString()})</span>}

            <div className="flex items-center gap-1 ml-2">
              {chapterNum > 1 && (
                <Link href={`/stories/${storyId}/write/${chapterNum - 1}`} className="px-2 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm transition-colors">
                  ←
                </Link>
              )}
              <Link href={`/stories/${storyId}/write/${chapterNum + 1}`} className="px-2 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm transition-colors">
                →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Main content */}
        <div className="space-y-4">
          {/* Outline card */}
          {outline && (
            <details className="rounded-xl border border-gray-800 bg-gray-900">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-400 hover:text-gray-200 select-none">
                Chapter Outline ▾
              </summary>
              <div className="px-4 pb-4 space-y-2 text-sm text-gray-400">
                <p><span className="text-gray-600">Scene:</span> {outline.sceneSummary}</p>
                {outline.emotionalBeat && <p><span className="text-gray-600">Emotional beat:</span> {outline.emotionalBeat}</p>}
                {outline.revelations && <p><span className="text-gray-600">Reveal:</span> {outline.revelations}</p>}
                {outline.withheld && <p><span className="text-gray-600">Withhold:</span> {outline.withheld}</p>}
                {outline.hookType && (
                  <p><span className="text-gray-600">Hook type:</span> <span className="text-violet-300">{HOOK_LABELS[outline.hookType] ?? outline.hookType}</span></p>
                )}
                {outline.hookDescription && <p><span className="text-gray-600">Hook direction:</span> {outline.hookDescription}</p>}
              </div>
            </details>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={generateChapter}
              disabled={streaming}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {streaming ? "Writing…" : content ? "Rewrite Chapter" : "Generate Chapter"}
            </button>

            {content && !streaming && (
              <button
                onClick={() => setMode(mode === "edit" ? "view" : "edit")}
                className="px-4 py-2.5 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium transition-colors"
              >
                {mode === "edit" ? "Preview" : "Edit"}
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-950 border border-red-800 text-red-300 px-4 py-3 text-sm">{error}</div>
          )}

          {/* Chapter content */}
          {mode === "view" ? (
            <div
              ref={contentRef}
              className="rounded-xl border border-gray-800 bg-gray-900 p-6 min-h-[400px] max-h-[calc(100vh-320px)] overflow-y-auto"
            >
              {!content && !streaming && (
                <div className="flex items-center justify-center h-48 text-gray-600">
                  {outline ? "Ready to generate. Click Generate Chapter." : "No outline found for this chapter."}
                </div>
              )}
              <div className="chapter-content space-y-0">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {streaming && <span className="inline-block w-0.5 h-5 bg-violet-400 animate-pulse ml-0.5" />}
              </div>
            </div>
          ) : (
            <textarea
              className="w-full rounded-xl border border-gray-700 bg-gray-900 p-6 text-gray-200 text-base leading-relaxed resize-none focus:border-violet-500 focus:outline-none min-h-[500px] font-mono text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Story State — "where am I in this story" briefing */}
          {!isFirstChapter && resume && (
            <div className="rounded-xl border border-violet-900/60 bg-violet-950/10 overflow-hidden">
              <button
                onClick={() => setStateOpen(!stateOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Story State</span>
                <span className="text-gray-600 text-xs">{stateOpen ? "▲" : "▼"}</span>
              </button>

              {stateOpen && (
                <div className="px-4 pb-4 space-y-3 text-xs text-gray-400">
                  {/* Last chapter hook */}
                  {resume.lastChapterNumber > 0 && resume.closingLines && (
                    <div className="space-y-1">
                      <span className="text-gray-600 uppercase tracking-wider text-[10px]">
                        Ch. {resume.lastChapterNumber} closed with{" "}
                        {resume.lastHookType && (
                          <span className="text-violet-400">{HOOK_LABELS[resume.lastHookType] ?? resume.lastHookType}</span>
                        )}
                      </span>
                      <blockquote className="italic text-gray-400 border-l-2 border-violet-800 pl-2 leading-relaxed">
                        {resume.closingLines.length > 200
                          ? `…${resume.closingLines.slice(-200)}`
                          : resume.closingLines}
                      </blockquote>
                    </div>
                  )}

                  {/* Protagonist state */}
                  {resume.protagonistState && (
                    <div className="space-y-0.5">
                      <span className="text-gray-600 uppercase tracking-wider text-[10px]">
                        {resume.protagonistName ? `${resume.protagonistName} right now` : "Protagonist"}
                      </span>
                      <p className="text-gray-400 leading-relaxed">{resume.protagonistState}</p>
                    </div>
                  )}

                  {/* Active promises */}
                  {resume.activeThreads.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-gray-600 uppercase tracking-wider text-[10px]">Promises to keep</span>
                      <ul className="space-y-1">
                        {resume.activeThreads.map((t, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="text-violet-700 shrink-0 mt-0.5">·</span>
                            <span className="text-gray-400">{t.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chapter Status */}
          {chapterData && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Chapter Status</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium ${chapterData.status === "approved" ? "text-green-400" : chapterData.status === "draft" ? "text-yellow-400" : "text-gray-300"}`}>
                    {chapterData.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Words</span>
                  <span className={meetsMinimum ? "text-green-400" : "text-amber-400"}>{wordCount.toLocaleString()}</span>
                </div>
              </div>

              {content && meetsMinimum && chapterData.status !== "approved" && (
                <button
                  onClick={approveChapter}
                  disabled={updateStatus.isPending}
                  className="w-full py-2 rounded-lg bg-green-800 hover:bg-green-700 disabled:opacity-50 text-green-200 font-medium text-sm transition-colors"
                >
                  ✓ Approve & Log Session
                </button>
              )}

              {chapterData.status === "approved" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <span>✓</span><span>Chapter approved</span>
                  </div>
                  <Link
                    href={`/stories/${storyId}/write/${chapterNum + 1}`}
                    className="block w-full text-center py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-medium text-sm transition-colors"
                  >
                    Next Chapter →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Revision */}
          {content && !streaming && chapterData?.status !== "approved" && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Request Revision</h3>
              <textarea
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-violet-500 focus:outline-none text-gray-300 text-sm resize-none placeholder-gray-600"
                placeholder="Describe what to change…"
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
              />
              <button
                onClick={requestRevision}
                disabled={!revisionNote.trim()}
                className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 font-medium text-sm transition-colors"
              >
                Log Revision Note
              </button>
            </div>
          )}

          {/* Arc context */}
          {outline?.arc && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Current Arc</h3>
              <p className="text-sm font-medium text-violet-300">{outline.arc.name}</p>
              <p className="text-xs text-gray-500">Ch. {outline.arc.startChapter}–{outline.arc.endChapter}</p>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{outline.arc.summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
