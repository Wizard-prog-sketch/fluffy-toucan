"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const STYLES = [
  { value: "cinematic", label: "Cinematic", desc: "Visual, action-driven, sharp scene cuts — like a film on the page" },
  { value: "intimate-first", label: "Intimate First-Person", desc: "Deep inside the protagonist's head — every thought, every sensation" },
  { value: "dramatic-third", label: "Dramatic Third-Person", desc: "Sweeping emotion, layered tension, authoritative narrator" },
  { value: "action-forward", label: "Action-Forward", desc: "Relentless momentum — short sentences, propulsive pacing" },
  { value: "slow-burn", label: "Slow Burn", desc: "Tension through restraint — charged subtext, quiet devastation" },
] as const;

const TONES = [
  { value: "dark-gritty", label: "Dark & Gritty", desc: "Raw, unflinching, morally complex — hope is earned through pain" },
  { value: "warm-light", label: "Warm with Heart", desc: "Believes in people even when they're broken — humor makes the hurt hit harder" },
  { value: "intense", label: "Deeply Intense", desc: "Everything matters enormously — a quiet scene carries years of weight" },
  { value: "suspense", label: "Suspense-Driven", desc: "Something always feels slightly wrong — the reader can never fully exhale" },
] as const;

const DIALOGUE = [
  { value: "low", label: "Sparse & Lethal", desc: "Every line does three things — what they don't say is louder" },
  { value: "medium", label: "Balanced", desc: "Conversation carries its weight alongside action and interiority" },
  { value: "high", label: "Dialogue-Dominant", desc: "Characters reveal themselves through speech — confrontation lives here" },
] as const;

const DESCRIPTION = [
  { value: "sparse", label: "Precise & Minimal", desc: "One detail does the work of ten — the reader's imagination completes the world" },
  { value: "medium", label: "Grounded & Selective", desc: "Enough to anchor the scene — description carries emotional weight" },
  { value: "rich", label: "Immersive & Textured", desc: "Fully realized world — every setting mirrors the interior state" },
] as const;

type StyleVal = typeof STYLES[number]["value"];
type ToneVal = typeof TONES[number]["value"];
type DialogueVal = typeof DIALOGUE[number]["value"];
type DescVal = typeof DESCRIPTION[number]["value"];

export default function VoicePage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = trpc.stories.byId.useQuery({ id: storyId });
  const { data: existing } = trpc.voice.byStory.useQuery({ storyId });
  const upsert = trpc.voice.upsert.useMutation();

  const [writingStyle, setWritingStyle] = useState<StyleVal>("cinematic");
  const [toneRegister, setToneRegister] = useState<ToneVal>("intense");
  const [dialogueIntensity, setDialogueIntensity] = useState<DialogueVal>("medium");
  const [descriptionDensity, setDescriptionDensity] = useState<DescVal>("medium");
  const [sampleText, setSampleText] = useState("");
  const [saved, setSaved] = useState(false);

  // Pre-fill from existing if available
  useState(() => {
    if (existing) {
      setWritingStyle((existing.writingStyle as StyleVal) || "cinematic");
      setToneRegister((existing.toneRegister as ToneVal) || "intense");
      setDialogueIntensity((existing.dialogueIntensity as DialogueVal) || "medium");
      setDescriptionDensity((existing.descriptionDensity as DescVal) || "medium");
      setSampleText(existing.sampleText || "");
    }
  });

  function handleSave() {
    upsert.mutate(
      { storyId, writingStyle, toneRegister, dialogueIntensity, descriptionDensity, sampleText },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); } }
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="text-sm text-gray-500 mb-1">
          <Link href={`/stories/${storyId}`} className="hover:text-gray-300">← {story?.title}</Link>
        </div>
        <h1 className="text-2xl font-bold text-white">Voice Calibration</h1>
        <p className="text-gray-400 text-sm mt-1 leading-relaxed">
          Your voice is the thread that runs through all 200 chapters. Set it once and the AI will protect it from Chapter 1 to Chapter 200.
        </p>
      </div>

      {/* Writing Style */}
      <Section title="Narrative Style" desc="How the story is told — the POV and structural feel of every chapter.">
        <div className="space-y-2">
          {STYLES.map((s) => (
            <OptionCard key={s.value} selected={writingStyle === s.value} onClick={() => setWritingStyle(s.value)} label={s.label} desc={s.desc} />
          ))}
        </div>
      </Section>

      {/* Tone */}
      <Section title="Tonal Register" desc="The emotional atmosphere that colors every scene — what the story feels like to live inside.">
        <div className="grid sm:grid-cols-2 gap-2">
          {TONES.map((t) => (
            <OptionCard key={t.value} selected={toneRegister === t.value} onClick={() => setToneRegister(t.value)} label={t.label} desc={t.desc} />
          ))}
        </div>
      </Section>

      {/* Dialogue */}
      <Section title="Dialogue Weight" desc="How much of the story's emotional work dialogue carries.">
        <div className="space-y-2">
          {DIALOGUE.map((d) => (
            <OptionCard key={d.value} selected={dialogueIntensity === d.value} onClick={() => setDialogueIntensity(d.value)} label={d.label} desc={d.desc} />
          ))}
        </div>
      </Section>

      {/* Description */}
      <Section title="Description Density" desc="How much sensory and environmental detail grounds each scene.">
        <div className="space-y-2">
          {DESCRIPTION.map((d) => (
            <OptionCard key={d.value} selected={descriptionDensity === d.value} onClick={() => setDescriptionDensity(d.value)} label={d.label} desc={d.desc} />
          ))}
        </div>
      </Section>

      {/* Sample Text */}
      <Section title="Your Writing Sample" desc="Paste a paragraph from your own writing or a story you love. The AI will use this as a living style reference — this is the most powerful calibration tool available.">
        <textarea
          rows={6}
          className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 focus:border-violet-500 focus:outline-none text-gray-200 text-sm leading-relaxed resize-none placeholder-gray-600"
          placeholder="Paste a passage that captures exactly how you want this story to read. It can be from your own writing, from a book you're inspired by, or from any chapter you've already written. The more specific, the better the AI preserves your voice."
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
        />
        <p className="text-xs text-gray-600 mt-2">This sample is never published — it's only used to calibrate the AI's output for your story.</p>
      </Section>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={upsert.isPending}
          className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors"
        >
          {upsert.isPending ? "Saving…" : "Save Voice Profile"}
        </button>
        {saved && <span className="text-green-400 text-sm">✓ Voice profile saved — all future chapters will use this calibration</span>}
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selected ? "border-violet-500 bg-violet-950/40" : "border-gray-800 bg-gray-900 hover:border-gray-600"}`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selected ? "border-violet-400" : "border-gray-600"}`}>
          {selected && <span className="w-2 h-2 rounded-full bg-violet-400" />}
        </span>
        <div>
          <span className={`text-sm font-medium ${selected ? "text-white" : "text-gray-300"}`}>{label}</span>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
    </button>
  );
}
