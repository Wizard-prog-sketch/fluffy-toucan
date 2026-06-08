import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="max-w-3xl space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950 border border-violet-800 text-violet-300 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Serialized Fiction Production Engine
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white">
          From idea to{" "}
          <span className="text-violet-400">200 chapters.</span>
        </h1>

        <p className="text-xl text-gray-400 leading-relaxed">
          Built exclusively for GoodNovel, WebNovel, Dreame, and Pocket FM writers.
          Generate ideas, build your arc structure, write every chapter with AI —
          without ever losing your voice.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors"
          >
            Open Dashboard →
          </Link>
          <Link
            href="/stories/new"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-lg transition-colors"
          >
            New Story
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-3 gap-8 text-center border-t border-gray-800">
          {[
            { value: "200+", label: "Chapters per story" },
            { value: "200K+", label: "Words produced" },
            { value: "5", label: "Platforms supported" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-violet-400">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
