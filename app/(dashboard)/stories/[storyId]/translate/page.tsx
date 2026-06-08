"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { LANGUAGES, LANGUAGE_GROUPS, getLanguageMeta } from "@/lib/ai/translationConstants";

const RTL_LANGS: Set<string> = new Set(LANGUAGES.filter((l) => l.rtl).map((l) => l.value));

function LanguageSelect({
  value,
  onChange,
  exclude,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude?: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-gray-200 text-sm"
      >
        {LANGUAGE_GROUPS.map((group) => {
          const groupLangs = LANGUAGES.filter((l) => l.group === group && l.value !== exclude);
          if (!groupLangs.length) return null;
          return (
            <optgroup key={group} label={group}>
              {groupLangs.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}

export default function TranslatePage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = trpc.stories.byId.useQuery({ id: storyId });
  const { data: allChapters } = trpc.chapters.byStory.useQuery({ storyId });

  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Chinese-Simplified");
  const [chapterNum, setChapterNum] = useState(1);
  const [mode, setMode] = useState<"single" | "range" | "all">("single");
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(10);

  const [streaming, setStreaming] = useState(false);
  const [translatedContent, setTranslatedContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [currentTranslatingChapter, setCurrentTranslatingChapter] = useState<number | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const { data: existingTranslation, refetch: refetchTranslation } = trpc.translation.byChapter.useQuery(
    { storyId, chapterNumber: chapterNum, targetLanguage: targetLang },
    { enabled: mode === "single" }
  );

  const { data: translatedChapters, refetch: refetchList } = trpc.translation.translatedChapters.useQuery(
    { storyId, targetLanguage: targetLang }
  );

  const approvedChapters = allChapters?.filter((c) => c.status === "approved") ?? [];
  const isRtl = RTL_LANGS.has(targetLang);
  const targetLabel = getLanguageMeta(targetLang).label;
  const sourceLabel = getLanguageMeta(sourceLang).label;

  function swap() {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setTranslatedContent("");
    setOriginalContent("");
  }

  async function translateSingle(chNum: number): Promise<string> {
    // Load original chapter content for display
    const chapterData = allChapters?.find((c) => c.chapterNumber === chNum);

    setCurrentTranslatingChapter(chNum);
    setStreaming(true);
    setError("");
    setTranslatedContent("");
    setOriginalContent("");

    let accumulated = "";

    try {
      const res = await fetch("/api/ai/translate-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, chapterNumber: chNum, sourceLanguage: sourceLang, targetLanguage: targetLang }),
      });

      if (!res.ok || !res.body) {
        const msg = await res.text();
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setTranslatedContent(accumulated);
        if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
      }

      await refetchTranslation();
      await refetchList();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStreaming(false);
      setCurrentTranslatingChapter(null);
    }

    return accumulated;
  }

  async function handleTranslate() {
    if (streaming) return;

    if (mode === "single") {
      await translateSingle(chapterNum);
    } else {
      const chapters =
        mode === "all"
          ? approvedChapters.map((c) => c.chapterNumber)
          : approvedChapters
              .map((c) => c.chapterNumber)
              .filter((n) => n >= rangeFrom && n <= rangeTo);

      if (!chapters.length) {
        setError("No approved chapters found in that range.");
        return;
      }

      setBatchProgress({ done: 0, total: chapters.length });
      setError("");

      for (let i = 0; i < chapters.length; i++) {
        await translateSingle(chapters[i]);
        setBatchProgress({ done: i + 1, total: chapters.length });
      }

      setBatchProgress(null);
    }
  }

  function copyTranslation() {
    navigator.clipboard.writeText(translatedContent);
  }

  function downloadTranslation() {
    const blob = new Blob([translatedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${story?.title ?? "story"} — Ch${mode === "single" ? chapterNum : "batch"} — ${targetLabel}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const displayContent = existingTranslation?.content && !translatedContent
    ? existingTranslation.content
    : translatedContent;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="text-sm text-gray-500 mb-1">
          <Link href={`/stories/${storyId}`} className="hover:text-gray-300">← {story?.title}</Link>
        </div>
        <h1 className="text-2xl font-bold text-white">Translation Studio</h1>
        <p className="text-gray-400 text-sm mt-1">
          Exact translation — same story, different language. Nothing added, nothing removed.
        </p>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Controls */}
        <div className="space-y-6">
          {/* Language pair */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Language Pair</h2>

            <LanguageSelect
              label="Translate from"
              value={sourceLang}
              onChange={(v) => { setSourceLang(v); setTranslatedContent(""); setOriginalContent(""); }}
              exclude={targetLang}
            />

            <button
              onClick={swap}
              className="w-full py-2 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white text-sm transition-colors"
            >
              ⇅ Swap Languages
            </button>

            <LanguageSelect
              label="Translate to"
              value={targetLang}
              onChange={(v) => { setTargetLang(v); setTranslatedContent(""); setOriginalContent(""); }}
              exclude={sourceLang}
            />
          </div>

          {/* Chapter selection */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Which Chapters</h2>

            <div className="flex rounded-lg overflow-hidden border border-gray-700 text-sm">
              {(["single", "range", "all"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 capitalize transition-colors ${mode === m ? "bg-violet-700 text-white" : "bg-gray-900 text-gray-400 hover:text-white"}`}
                >
                  {m === "single" ? "One" : m === "range" ? "Range" : "All"}
                </button>
              ))}
            </div>

            {mode === "single" && (
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Chapter number</label>
                <input
                  type="number"
                  min={1}
                  value={chapterNum}
                  onChange={(e) => setChapterNum(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-violet-500 focus:outline-none text-gray-200 text-sm"
                />
                {existingTranslation && (
                  <p className="text-xs text-green-500">✓ Translation saved — showing existing. Translate again to update.</p>
                )}
              </div>
            )}

            {mode === "range" && (
              <div className="grid grid-cols-2 gap-3">
                {[["From", rangeFrom, setRangeFrom] as const, ["To", rangeTo, setRangeTo] as const].map(([label, val, setter]) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Ch. {label}</label>
                    <input
                      type="number"
                      min={1}
                      value={val}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-violet-500 focus:outline-none text-gray-200 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {mode === "all" && (
              <p className="text-sm text-gray-400">
                Translates all <span className="text-white">{approvedChapters.length}</span> approved chapters.
              </p>
            )}
          </div>

          {/* Translate button */}
          <button
            onClick={handleTranslate}
            disabled={streaming || sourceLang === targetLang}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {streaming
              ? currentTranslatingChapter
                ? `Translating Ch. ${currentTranslatingChapter}…`
                : "Translating…"
              : `Translate to ${targetLabel}`}
          </button>

          {/* Batch progress */}
          {batchProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Chapters translated</span>
                <span>{batchProgress.done} / {batchProgress.total}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${Math.round((batchProgress.done / batchProgress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-950 border border-red-800 text-red-300 px-4 py-3 text-sm">{error}</div>
          )}

          {/* Already-translated chapters list */}
          {translatedChapters && translatedChapters.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {targetLabel} — {translatedChapters.length} chapters saved
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {translatedChapters.map((t) => (
                  <button
                    key={t.chapterNumber}
                    onClick={() => {
                      setMode("single");
                      setChapterNum(t.chapterNumber);
                      setTranslatedContent("");
                    }}
                    className="text-xs px-2 py-1 rounded-md bg-gray-800 hover:bg-violet-900 text-gray-400 hover:text-violet-200 transition-colors"
                  >
                    Ch. {t.chapterNumber}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Translation output */}
        <div className="space-y-4">
          {displayContent ? (
            <>
              {/* Output header */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {mode === "single" ? `Chapter ${chapterNum}` : "Translation"} — {targetLabel}
                  </span>
                  {isRtl && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">RTL</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white transition-colors"
                  >
                    {showOriginal ? "Hide original" : "Show original"}
                  </button>
                  <button
                    onClick={copyTranslation}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={downloadTranslation}
                    className="text-xs px-3 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 text-white transition-colors"
                  >
                    Download .txt
                  </button>
                </div>
              </div>

              {/* Content panels */}
              <div className={`grid gap-4 ${showOriginal ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                {/* Translation */}
                <div
                  ref={contentRef}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-6 min-h-[500px] max-h-[70vh] overflow-y-auto"
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  <div className={`space-y-4 text-gray-200 text-sm leading-loose ${isRtl ? "text-right" : ""}`}>
                    {displayContent.split(/\n+/).filter((p) => p.trim()).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    {streaming && (
                      <span className="inline-block w-0.5 h-5 bg-violet-400 animate-pulse ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Original (side by side when toggled) */}
                {showOriginal && (
                  <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 min-h-[500px] max-h-[70vh] overflow-y-auto">
                    <p className="text-xs text-gray-600 mb-4 uppercase tracking-wider">{sourceLabel} — Original</p>
                    <OriginalChapterContent storyId={storyId} chapterNumber={chapterNum} />
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-600">
                {displayContent.trim().split(/\s+/).length.toLocaleString()} words translated
                {existingTranslation && !translatedContent ? " · Saved translation" : streaming ? " · Translating…" : " · Translation complete"}
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900 flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-3 max-w-sm px-6">
                <div className="text-4xl text-gray-700">◎</div>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Select a language pair and chapter, then click Translate. The exact story will appear here in {targetLabel} — every word, every paragraph, every emotion preserved.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OriginalChapterContent({ storyId, chapterNumber }: { storyId: string; chapterNumber: number }) {
  const { data } = trpc.chapters.byNumber.useQuery({ storyId, chapterNumber });
  if (!data?.content) return <p className="text-gray-600 text-sm">No content for this chapter.</p>;
  return (
    <div className="space-y-4 text-gray-400 text-sm leading-loose">
      {data.content.split(/\n+/).filter((p) => p.trim()).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
