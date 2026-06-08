"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const HOOK_COLOR: Record<string, string> = {
  revelation: "text-amber-400",
  confrontation: "text-red-400",
  "gut-punch": "text-pink-400",
  danger: "text-orange-400",
  mystery: "text-violet-400",
  arrival: "text-blue-400",
};

export default function OutlinePage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = trpc.stories.byId.useQuery({ id: storyId });
  const { data: outlines } = trpc.outlines.byStory.useQuery({ storyId });
  const approve = trpc.outlines.approve.useMutation();

  const approvedCount = outlines?.filter((o) => o.approved).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500 mb-1">
            <Link href={`/stories/${storyId}`} className="hover:text-gray-300">← {story?.title}</Link>
          </div>
          <h1 className="text-2xl font-bold text-white">Chapter Outline</h1>
          <p className="text-gray-400 text-sm mt-1">
            {outlines?.length ?? 0} chapters outlined · {approvedCount} approved
          </p>
        </div>
        <Link
          href={`/stories/${storyId}/arcs`}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          ← Back to Arcs
        </Link>
      </div>

      {!outlines?.length && (
        <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center space-y-3">
          <p className="text-gray-400">No outlines yet. Generate arc structure first, then build chapter outlines.</p>
          <Link href={`/stories/${storyId}/arcs`} className="text-violet-400 hover:text-violet-300 text-sm">
            Go to Arc Builder →
          </Link>
        </div>
      )}

      {outlines && outlines.length > 0 && (
        <div className="space-y-2">
          {outlines.map((outline) => {
            const chStatus = outline.chapter?.status;
            return (
              <div key={outline.id} className={`rounded-xl border bg-gray-900 p-4 transition-all ${outline.approved ? "border-violet-800" : "border-gray-800"}`}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 text-center">
                    <div className="text-lg font-bold text-gray-500">{outline.chapterNumber}</div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {outline.title && <span className="font-medium text-white text-sm">{outline.title}</span>}
                      {outline.arc && <span className="text-xs text-gray-600">{outline.arc.name}</span>}
                      {outline.hookType && (
                        <span className={`text-xs font-medium ${HOOK_COLOR[outline.hookType] ?? "text-gray-400"}`}>
                          [{outline.hookType}]
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{outline.sceneSummary}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {outline.location && <span>{outline.location}</span>}
                      <span>{outline.wordCountTarget.toLocaleString()} words target</span>
                      {chStatus && <span className={chStatus === "approved" ? "text-green-400" : chStatus === "draft" ? "text-yellow-400" : "text-gray-500"}>Chapter: {chStatus}</span>}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {chStatus === "approved" ? (
                      <span className="text-xs text-green-400">✓ Written</span>
                    ) : (
                      <Link
                        href={`/stories/${storyId}/write/${outline.chapterNumber}`}
                        className="text-xs px-3 py-1.5 rounded-lg bg-violet-800 hover:bg-violet-700 text-violet-200 font-medium transition-colors"
                      >
                        Write →
                      </Link>
                    )}
                    <button
                      onClick={() => approve.mutate({ id: outline.id, approved: !outline.approved })}
                      className={`text-xs px-2 py-1.5 rounded-lg transition-colors ${outline.approved ? "bg-violet-900 text-violet-300 hover:bg-violet-800" : "bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300"}`}
                    >
                      {outline.approved ? "✓ Approved" : "Approve"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
