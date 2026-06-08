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
          create.mutate({ ...form, writerMode });
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
