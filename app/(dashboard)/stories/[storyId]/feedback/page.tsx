"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

type Scope = "story" | "plot" | "chapter";
type Category = "voice" | "pacing" | "character" | "plot" | "hook" | "emotion" | "dialogue" | "structure" | "rejection" | "general";
type Severity = "high" | "medium" | "low";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "rejection", label: "Platform Rejection Reason" },
  { value: "hook", label: "Hook / Chapter Ending" },
  { value: "plot", label: "Plot / Story Structure" },
  { value: "character", label: "Character Development" },
  { value: "emotion", label: "Emotional Impact" },
  { value: "pacing", label: "Pacing" },
  { value: "dialogue", label: "Dialogue" },
  { value: "voice", label: "Writer's Voice" },
  { value: "structure", label: "Arc / Scene Structure" },
  { value: "general", label: "General Note" },
];

const SEVERITY_STYLES: Record<Severity, string> = {
  high: "bg-red-950 text-red-300 border-red-900",
  medium: "bg-amber-950 text-amber-300 border-amber-900",
  low: "bg-gray-800 text-gray-400 border-gray-700",
};

const SEVERITY_DOT: Record<Severity, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-gray-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  rejection: "Rejection Reason",
  hook: "Hook",
  plot: "Plot",
  character: "Character",
  emotion: "Emotion",
  pacing: "Pacing",
  dialogue: "Dialogue",
  voice: "Voice",
  structure: "Structure",
  general: "Note",
};

const SCOPE_LABELS: Record<Scope, string> = {
  story: "Whole Story",
  plot: "Plot / Arc",
  chapter: "Chapter",
};

export default function FeedbackPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = trpc.stories.byId.useQuery({ id: storyId });
  const { data: notes, refetch } = trpc.feedback.byStory.useQuery({ storyId });

  const add = trpc.feedback.add.useMutation({ onSuccess: () => { refetch(); resetForm(); } });
  const resolve = trpc.feedback.resolve.useMutation({ onSuccess: () => refetch() });
  const reopen = trpc.feedback.reopen.useMutation({ onSuccess: () => refetch() });
  const remove = trpc.feedback.delete.useMutation({ onSuccess: () => refetch() });

  const [scope, setScope] = useState<Scope>("story");
  const [chapterNumber, setChapterNumber] = useState(1);
  const [category, setCategory] = useState<Category>("general");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [feedbackText, setFeedbackText] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setFeedbackText("");
    setScope("story");
    setCategory("general");
    setSeverity("medium");
    setChapterNumber(1);
  }

  function handleAdd() {
    if (!feedbackText.trim()) return;
    add.mutate({
      storyId,
      scope,
      chapterNumber: scope === "chapter" ? chapterNumber : undefined,
      category,
      severity,
      feedback: feedbackText.trim(),
    });
  }

  const active = notes?.filter((n) => !n.resolved) ?? [];
  const resolved = notes?.filter((n) => n.resolved) ?? [];
  const displayed = activeTab === "active" ? active : resolved;

  const highCount = active.filter((n) => n.severity === "high").length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="text-sm text-gray-500 mb-1">
          <Link href={`/stories/${storyId}`} className="hover:text-gray-300">← {story?.title}</Link>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Feedback & Correction Notes</h1>
            <p className="text-gray-400 text-sm mt-1 leading-relaxed max-w-xl">
              Write what you see that needs fixing — in the plot, the chapters, or the reason a platform rejected this story. Every active note feeds directly into the AI when generating the next chapter, so the same mistakes don't repeat.
            </p>
          </div>
          {highCount > 0 && (
            <div className="shrink-0 px-3 py-1.5 rounded-full bg-red-950 border border-red-900 text-red-300 text-sm font-medium">
              {highCount} high priority
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8">
        {/* Add feedback form */}
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Add a Correction Note</h2>

            {/* Scope */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">What this applies to</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-700 text-sm">
                {(["story", "plot", "chapter"] as Scope[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    className={`flex-1 py-2 capitalize transition-colors ${scope === s ? "bg-violet-700 text-white" : "bg-gray-900 text-gray-400 hover:text-white"}`}
                  >
                    {SCOPE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter number — only when scope is chapter */}
            {scope === "chapter" && (
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Chapter number</label>
                <input
                  type="number"
                  min={1}
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-violet-500 focus:outline-none text-gray-200 text-sm"
                />
              </div>
            )}

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-violet-500 focus:outline-none text-gray-200 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">How critical is this</label>
              <div className="flex gap-2">
                {(["high", "medium", "low"] as Severity[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`flex-1 py-2 rounded-lg border text-sm capitalize font-medium transition-colors ${severity === s ? SEVERITY_STYLES[s] : "border-gray-700 bg-gray-900 text-gray-500 hover:text-gray-300"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback text */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Your observation</label>
              <textarea
                rows={4}
                className="w-full px-3 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-violet-500 focus:outline-none text-gray-200 text-sm resize-none placeholder-gray-600 leading-relaxed"
                placeholder={
                  category === "rejection"
                    ? "Describe the rejection reason — what did the platform say? What specifically was the problem?"
                    : category === "hook"
                    ? "What was wrong with the hook? What did it need to be instead?"
                    : category === "emotion"
                    ? "What emotional beat was missed or rushed? What should have been there?"
                    : "Be specific — describe exactly what the problem was and what it should be instead."
                }
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              <p className="text-xs text-gray-600">The more specific you are, the more directly the AI can fix it.</p>
            </div>

            <button
              onClick={handleAdd}
              disabled={!feedbackText.trim() || add.isPending}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold transition-colors text-sm"
            >
              {add.isPending ? "Adding…" : "Add Correction Note"}
            </button>
          </div>

          {/* How this works */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">How this works</h3>
            <ul className="space-y-1.5 text-xs text-gray-500 leading-relaxed">
              <li>• Every <span className="text-gray-300">active</span> note is sent to the AI before each chapter is generated</li>
              <li>• The AI treats them as direct corrections — not suggestions</li>
              <li>• When an issue is fixed, mark it <span className="text-gray-300">resolved</span> so it stops being repeated</li>
              <li>• <span className="text-red-400">High priority</span> notes appear first in the AI's instruction list</li>
              <li>• Rejection reasons from platforms are the most important notes to add</li>
            </ul>
          </div>
        </div>

        {/* Notes list */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-gray-800 pb-3">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "active" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              Active notes
              {active.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-violet-700 text-white text-xs">{active.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("resolved")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "resolved" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              Resolved
              {resolved.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-400 text-xs">{resolved.length}</span>
              )}
            </button>
          </div>

          {displayed.length === 0 ? (
            <div className="flex items-center justify-center h-48 rounded-xl border border-gray-800 bg-gray-900/50">
              <p className="text-gray-600 text-sm">
                {activeTab === "active"
                  ? "No active correction notes yet. Add your first observation."
                  : "No resolved notes yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map((note) => (
                <div
                  key={note.id}
                  className={`rounded-xl border p-4 space-y-3 transition-opacity ${note.resolved ? "opacity-50 border-gray-800 bg-gray-900/30" : "border-gray-800 bg-gray-900"}`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Severity dot */}
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${SEVERITY_DOT[note.severity as Severity] ?? "bg-gray-500"}`} />
                      {/* Category */}
                      <span className="text-xs font-medium text-gray-300">
                        {CATEGORY_LABELS[note.category] ?? note.category}
                      </span>
                      {/* Scope */}
                      <span className="text-xs text-gray-600">
                        {note.scope === "chapter" && note.chapterNumber
                          ? `Ch. ${note.chapterNumber}`
                          : SCOPE_LABELS[note.scope as Scope]}
                      </span>
                      {/* Severity badge */}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[note.severity as Severity] ?? SEVERITY_STYLES.low}`}>
                        {note.severity}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {note.resolved ? (
                        <button
                          onClick={() => reopen.mutate({ id: note.id })}
                          className="text-xs px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                          Reopen
                        </button>
                      ) : (
                        <button
                          onClick={() => resolve.mutate({ id: note.id })}
                          className="text-xs px-2.5 py-1 rounded-md bg-green-900 hover:bg-green-800 text-green-300 transition-colors"
                        >
                          ✓ Mark resolved
                        </button>
                      )}
                      <button
                        onClick={() => remove.mutate({ id: note.id })}
                        className="text-xs px-2 py-1 rounded-md bg-gray-900 hover:bg-red-950 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Feedback text */}
                  <p className="text-sm text-gray-300 leading-relaxed">{note.feedback}</p>

                  {/* Timestamp */}
                  <p className="text-xs text-gray-600">
                    Added {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {note.resolved && " · Resolved"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
