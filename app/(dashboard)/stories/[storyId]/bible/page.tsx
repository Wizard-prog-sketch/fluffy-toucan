"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

type Tab = "characters" | "threads" | "world" | "hooks";

export default function BiblePage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = trpc.stories.byId.useQuery({ id: storyId });
  const { data: bible, refetch } = trpc.bible.byStory.useQuery({ storyId });
  const [tab, setTab] = useState<Tab>("characters");
  const upsertChar = trpc.bible.upsertCharacter.useMutation({ onSuccess: () => { refetch(); setCharForm(null); } });
  const deleteChar = trpc.bible.deleteCharacter.useMutation({ onSuccess: () => refetch() });
  const upsertThread = trpc.bible.upsertPlotThread.useMutation({ onSuccess: () => { refetch(); setThreadForm(null); } });
  const upsertWorld = trpc.bible.upsertWorldElement.useMutation({ onSuccess: () => { refetch(); setWorldForm(null); } });

  const [charForm, setCharForm] = useState<any>(null);
  const [threadForm, setThreadForm] = useState<any>(null);
  const [worldForm, setWorldForm] = useState<any>(null);

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "characters", label: "Characters", count: bible?.characters.length },
    { id: "threads", label: "Plot Threads", count: bible?.plotThreads.length },
    { id: "world", label: "World Elements", count: bible?.worldElements.length },
    { id: "hooks", label: "Hook Log", count: bible?.hookLog.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500 mb-1">
          <Link href={`/stories/${storyId}`} className="hover:text-gray-300">← {story?.title}</Link>
        </div>
        <h1 className="text-2xl font-bold text-white">Story Bible</h1>
        <p className="text-gray-400 text-sm mt-1">Living consistency tracker — characters, threads, world, hooks</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.id ? "border-violet-500 text-violet-300" : "border-transparent text-gray-500 hover:text-gray-300"}`}
          >
            {t.label} {t.count !== undefined && <span className="ml-1 text-xs opacity-60">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Characters */}
      {tab === "characters" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setCharForm({ storyId, name: "", role: "supporting", physicalDesc: "", speechPatterns: "", backstory: "", wounds: "", currentArc: "", introducedChapter: 1, lastSeenChapter: 1 })}
              className="px-4 py-2 rounded-lg bg-violet-800 hover:bg-violet-700 text-violet-200 text-sm font-medium transition-colors"
            >
              + Add Character
            </button>
          </div>

          {charForm && (
            <form onSubmit={(e) => { e.preventDefault(); upsertChar.mutate(charForm); }} className="rounded-xl border border-violet-800 bg-violet-950/20 p-5 space-y-3">
              <h3 className="font-semibold text-white">New Character</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Name", "name", "text"],
                  ["Role", "role", "select"],
                  ["Introduced Ch.", "introducedChapter", "number"],
                  ["Last seen Ch.", "lastSeenChapter", "number"],
                ].map(([label, key, type]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-gray-400">{label}</label>
                    {type === "select" ? (
                      <select className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm" value={charForm[key]} onChange={(e) => setCharForm({ ...charForm, [key]: e.target.value })}>
                        {["protagonist", "antagonist", "supporting", "minor"].map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <input type={type} className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm" value={charForm[key]} onChange={(e) => setCharForm({ ...charForm, [key]: type === "number" ? Number(e.target.value) : e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
              {[["Physical Description", "physicalDesc"], ["Speech Patterns", "speechPatterns"], ["Backstory", "backstory"], ["Emotional Wounds", "wounds"], ["Current Arc", "currentArc"]].map(([label, key]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-gray-400">{label}</label>
                  <textarea rows={2} className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm resize-none" value={charForm[key]} onChange={(e) => setCharForm({ ...charForm, [key]: e.target.value })} />
                </div>
              ))}
              <div className="flex gap-2">
                <button type="submit" disabled={upsertChar.isPending} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium">{upsertChar.isPending ? "Saving…" : "Save Character"}</button>
                <button type="button" onClick={() => setCharForm(null)} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {bible?.characters.map((char) => (
              <div key={char.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${char.role === "protagonist" ? "bg-violet-900 text-violet-300" : char.role === "antagonist" ? "bg-red-900 text-red-300" : "bg-gray-800 text-gray-400"}`}>{char.role}</span>
                    <span className="font-semibold text-white">{char.name}</span>
                    <span className="text-xs text-gray-600">Ch.{char.introducedChapter}–{char.lastSeenChapter}</span>
                  </div>
                  <button onClick={() => deleteChar.mutate({ id: char.id })} className="text-xs text-gray-600 hover:text-red-400 transition-colors">Remove</button>
                </div>
                {char.physicalDesc && <p className="text-xs text-gray-400">{char.physicalDesc}</p>}
                {char.wounds && <p className="text-xs text-gray-500 italic">Wound: {char.wounds}</p>}
                {char.currentArc && <p className="text-xs text-gray-500">Arc: {char.currentArc}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plot Threads */}
      {tab === "threads" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setThreadForm({ storyId, title: "", description: "", openedChapter: 1, status: "open", lastMentionedChapter: 0 })} className="px-4 py-2 rounded-lg bg-violet-800 hover:bg-violet-700 text-violet-200 text-sm font-medium transition-colors">
              + Add Thread
            </button>
          </div>
          {threadForm && (
            <form onSubmit={(e) => { e.preventDefault(); upsertThread.mutate(threadForm); }} className="rounded-xl border border-violet-800 bg-violet-950/20 p-5 space-y-3">
              <input placeholder="Thread title" className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm" value={threadForm.title} onChange={(e) => setThreadForm({ ...threadForm, title: e.target.value })} />
              <textarea rows={2} placeholder="Description" className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm resize-none" value={threadForm.description} onChange={(e) => setThreadForm({ ...threadForm, description: e.target.value })} />
              <input type="number" placeholder="Opened chapter" className="w-32 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm" value={threadForm.openedChapter} onChange={(e) => setThreadForm({ ...threadForm, openedChapter: Number(e.target.value) })} />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium">Save Thread</button>
                <button type="button" onClick={() => setThreadForm(null)} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm">Cancel</button>
              </div>
            </form>
          )}
          <div className="space-y-3">
            {bible?.plotThreads.map((t) => (
              <div key={t.id} className={`rounded-xl border p-4 space-y-1 ${t.status === "open" ? "border-amber-900 bg-amber-950/10" : t.status === "resolved" ? "border-green-900 bg-green-950/10" : "border-red-900 bg-red-950/10"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm">{t.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "open" ? "bg-amber-900 text-amber-300" : t.status === "resolved" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>{t.status}</span>
                </div>
                <p className="text-xs text-gray-400">{t.description}</p>
                <p className="text-xs text-gray-600">Opened Ch.{t.openedChapter}{t.resolvedChapter ? ` · Resolved Ch.${t.resolvedChapter}` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* World Elements */}
      {tab === "world" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setWorldForm({ storyId, category: "location", name: "", description: "", firstMentionedChapter: 1 })} className="px-4 py-2 rounded-lg bg-violet-800 hover:bg-violet-700 text-violet-200 text-sm font-medium transition-colors">
              + Add Element
            </button>
          </div>
          {worldForm && (
            <form onSubmit={(e) => { e.preventDefault(); upsertWorld.mutate(worldForm); }} className="rounded-xl border border-violet-800 bg-violet-950/20 p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Name" className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm" value={worldForm.name} onChange={(e) => setWorldForm({ ...worldForm, name: e.target.value })} />
                <select className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm" value={worldForm.category} onChange={(e) => setWorldForm({ ...worldForm, category: e.target.value })}>
                  {["location", "rule", "hierarchy", "organization", "lore"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea rows={2} placeholder="Description" className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm resize-none" value={worldForm.description} onChange={(e) => setWorldForm({ ...worldForm, description: e.target.value })} />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium">Save</button>
                <button type="button" onClick={() => setWorldForm(null)} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm">Cancel</button>
              </div>
            </form>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {bible?.worldElements.map((w) => (
              <div key={w.id} className="rounded-xl border border-gray-800 bg-gray-900 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 uppercase">{w.category}</span>
                  <span className="font-medium text-white text-sm">{w.name}</span>
                </div>
                <p className="text-xs text-gray-400">{w.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hook Log */}
      {tab === "hooks" && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Recent 20 chapter hooks — system uses this to vary hook types automatically.</p>
          {bible?.hookLog.map((h) => (
            <div key={h.id} className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5">
              <span className="text-gray-600 text-sm w-12">Ch.{h.chapterNumber}</span>
              <span className="text-violet-300 text-sm font-medium w-28">{h.hookType}</span>
              <span className="text-gray-400 text-sm flex-1 truncate">{h.hookSummary}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
