"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const GENRES = ["Romance", "Fantasy", "Urban", "Werewolf", "CEO/Billionaire", "Revenge", "Paranormal", "Thriller", "Sci-fi", "Martial Arts", "Dark Romance", "Mystery", "Drama"];

export default function NewStoryPage() {
  const router = useRouter();
  const [step, setStep] = useState<"mode" | "details">("mode");
  const [writerMode, setWriterMode] = useState<"typeA" | "typeB">("typeA");
  const [form, setForm] = useState({ title: "", genre: "", subGenre: "", platformId: "", targetChapters: 200, synopsis: "" });
  const [existingOutline, setExistingOutline] = useState("");
  const [hasExistingChapters, setHasExistingChapters] = useState(false);
  const [existingChapters, setExistingChapters] = useState("");
  const [hasChapterOutlines, setHasChapterOutlines] = useState(false);
  const [chapterByChapterOutline, setChapterByChapterOutline] = useState("");

  const { data: platforms } = trpc.platforms.list.useQuery();
  const create = trpc.stories.create.useMutation({
    onSuccess: (story) => router.push(`/stories/${story.id}`),
  });

  if (step === "mode") {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Start a New Story</h1>
          <p className="text-gray-400 mt-2">How are you coming in?</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              mode: "typeA" as const,
              title: "Start from Nothing",
              desc: "I have an idea or just a genre in mind. The platform will help me build the concept, plot, arcs, and full chapter outline from scratch.",
              icon: "✦",
            },
            {
              mode: "typeB" as const,
              title: "I Have My Own Outline",
              desc: "I already have a plot and outline. I need the platform to develop it into written chapters — at scale, with full consistency support.",
              icon: "◈",
            },
          ].map((opt) => (
            <button
              key={opt.mode}
              onClick={() => { setWriterMode(opt.mode); setStep("details"); }}
              className="text-left p-6 rounded-xl border-2 border-gray-700 hover:border-violet-500 bg-gray-900 hover:bg-gray-800 transition-all space-y-3"
            >
              <div className="text-3xl text-violet-400">{opt.icon}</div>
              <h3 className="font-semibold text-white text-lg">{opt.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <button onClick={() => setStep("mode")} className="text-sm text-gray-500 hover:text-gray-300 mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-white">Story Details</h1>
        <p className="text-gray-400 mt-1">{writerMode === "typeA" ? "Starting from scratch" : "Bringing your own outline"}</p>
      </div>

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ ...form, writerMode, existingOutline, existingChapters: hasExistingChapters ? existingChapters : "", chapterByChapterOutline: hasChapterOutlines ? chapterByChapterOutline : "" });
        }}
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Story Title</label>
          <input
            required
            className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-white placeholder-gray-500"
            placeholder="Give your story a working title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Primary Genre</label>
            <select
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-white"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
            >
              <option value="">Select genre</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Sub-genre <span className="text-gray-600">(optional)</span></label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-white placeholder-gray-500"
              placeholder="e.g. Second chance"
              value={form.subGenre}
              onChange={(e) => setForm({ ...form, subGenre: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Target Platform</label>
          <select
            required
            className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-white"
            value={form.platformId}
            onChange={(e) => setForm({ ...form, platformId: e.target.value })}
          >
            <option value="">Select platform</option>
            {platforms?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Target Chapter Count</label>
          <input
            type="number"
            min={50}
            max={1000}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-white"
            value={form.targetChapters}
            onChange={(e) => setForm({ ...form, targetChapters: Number(e.target.value) })}
          />
          <p className="text-xs text-gray-500">Minimum 200 recommended. That's ~200,000 words.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Story Synopsis <span className="text-gray-600">(optional)</span></label>
          <textarea
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-white placeholder-gray-500 resize-none"
            placeholder="Brief story premise — we'll help develop it further..."
            value={form.synopsis}
            onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
          />
        </div>

        {/* ── Writer B extra fields ── */}
        {writerMode === "typeB" && (
          <div className="space-y-5 pt-2 border-t border-gray-800">
            <p className="text-xs text-violet-400 uppercase tracking-wider font-semibold">Your Existing Material</p>

            {/* Outline */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Your Story Outline <span className="text-gray-600">(optional)</span>
              </label>
              <textarea
                rows={8}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-white placeholder-gray-500 resize-none text-sm leading-relaxed"
                placeholder={`Paste your full outline here — arc descriptions, chapter summaries, plot points, character arcs. Any format is fine.\n\nExample:\nArc 1: Elena discovers she's been replaced at work...\nChapter 1: Elena walks in on her own replacement meeting...\nChapter 2: She decides to fight back...`}
                value={existingOutline}
                onChange={(e) => setExistingOutline(e.target.value)}
              />
              <p className="text-xs text-gray-600">The AI will use this as the blueprint for every chapter it generates.</p>
            </div>

            {/* Existing chapters toggle */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setHasExistingChapters(!hasExistingChapters)}
                className={`flex items-center gap-3 w-full p-4 rounded-xl border transition-all text-left ${hasExistingChapters ? "border-violet-600 bg-violet-950/30" : "border-gray-700 bg-gray-900 hover:border-gray-600"}`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${hasExistingChapters ? "border-violet-500 bg-violet-500" : "border-gray-600"}`}>
                  {hasExistingChapters && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">I have chapters already written</div>
                  <div className="text-xs text-gray-500 mt-0.5">Paste them in — the platform will import them and continue from where you stopped</div>
                </div>
              </button>

              {hasExistingChapters && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Paste Your Existing Chapters</label>
                  <textarea
                    rows={12}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-white placeholder-gray-500 resize-none text-sm leading-relaxed font-mono"
                    placeholder={`Start each chapter with "Chapter 1", "Chapter 2", etc. on its own line, then paste the chapter content below it.\n\nChapter 1\nElena had rehearsed this moment a hundred times...\n\nChapter 2\nThe boardroom was already full when she arrived...`}
                    value={existingChapters}
                    onChange={(e) => setExistingChapters(e.target.value)}
                  />
                  <p className="text-xs text-gray-600">
                    Each chapter must start with <span className="text-gray-400">Chapter N</span> on its own line. All pasted chapters will be marked as approved and the platform will continue from the next chapter.
                  </p>
                </div>
              )}
            </div>

            {/* Chapter-by-chapter outline toggle */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setHasChapterOutlines(!hasChapterOutlines)}
                className={`flex items-center gap-3 w-full p-4 rounded-xl border transition-all text-left ${hasChapterOutlines ? "border-violet-600 bg-violet-950/30" : "border-gray-700 bg-gray-900 hover:border-gray-600"}`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${hasChapterOutlines ? "border-violet-500 bg-violet-500" : "border-gray-600"}`}>
                  {hasChapterOutlines && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">I have a chapter-by-chapter outline</div>
                  <div className="text-xs text-gray-500 mt-0.5">Paste each chapter's plan — the AI reads it before writing that chapter so it follows your exact vision</div>
                </div>
              </button>

              {hasChapterOutlines && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Chapter-by-Chapter Outline</label>
                  <textarea
                    rows={14}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-white placeholder-gray-500 resize-none text-sm leading-relaxed"
                    placeholder={`Write each chapter plan starting with "Chapter N" on its own line.\nYou can optionally add Emotional Beat and Hook lines.\n\nChapter 1\nElena arrives at her office to find a stranger sitting at her desk during a board meeting she was never invited to. She realizes she's being replaced.\nEmotional Beat: Shock turns to quiet rage\nHook: She recognizes the new hire — it's her ex.\n\nChapter 2\nElena confronts her boss in private. He confirms the transition. She refuses to go quietly.\nEmotional Beat: Humiliation becomes determination\n\nChapter 3\nShe begins building her case for wrongful dismissal while pretending everything is normal.`}
                    value={chapterByChapterOutline}
                    onChange={(e) => setChapterByChapterOutline(e.target.value)}
                  />
                  <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-3 space-y-1">
                    <p className="text-xs text-gray-400 font-medium">Supported fields per chapter:</p>
                    <p className="text-xs text-gray-500"><span className="text-gray-300">Chapter N</span> — required, starts each entry</p>
                    <p className="text-xs text-gray-500"><span className="text-gray-300">Emotional Beat: ...</span> — optional, what the reader must feel</p>
                    <p className="text-xs text-gray-500"><span className="text-gray-300">Hook: ...</span> — optional, how the chapter should end</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={create.isPending}
          className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors"
        >
          {create.isPending ? "Creating…" : "Create Story →"}
        </button>
      </form>
    </div>
  );
}
