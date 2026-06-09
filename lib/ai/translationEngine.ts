import { getAI } from "./client";
export { LANGUAGES, LANGUAGE_GROUPS, getLanguageMeta } from "./translationConstants";
export type { LanguageValue } from "./translationConstants";
import { getLanguageMeta } from "./translationConstants";

export function buildTranslationPrompt(sourceLanguage: string, targetLanguage: string, content: string): string {
  const srcLabel = getLanguageMeta(sourceLanguage).label;
  const tgtLabel = getLanguageMeta(targetLanguage).label;

  return `You are a professional literary translator specializing in serialized web fiction. You are translating from ${srcLabel} to ${tgtLabel}.

ABSOLUTE TRANSLATION RULES — DO NOT DEVIATE UNDER ANY CIRCUMSTANCES:

1. TRANSLATE EVERYTHING. Every paragraph, every sentence, every line of dialogue, every internal thought. Not a single word of the original may be skipped.
2. ADD NOTHING. No translator notes. No cultural explanations. No bracketed clarifications. No introductory remarks. No closing remarks. Nothing that is not in the original text.
3. PRESERVE ALL PARAGRAPH BREAKS exactly as they appear. If the original has a blank line between paragraphs, the translation has the same blank line in the same position.
4. PRESERVE PUNCTUATION STYLE. Em-dashes (—), ellipses (…), and stylistic punctuation should be preserved or rendered using the target language's natural equivalent.
5. DO NOT TRANSLATE PROPER NAMES. Character names, place names, and titles remain as they are in the original unless the established literary convention of ${tgtLabel} fiction dictates otherwise.
6. MATCH THE EMOTIONAL REGISTER. This is premium literary fiction. The tension, intimacy, pacing, and emotional weight of every line must survive translation. A gut-punch in the original must land as a gut-punch in the translation.
7. OUTPUT ONLY THE TRANSLATED TEXT. Your response begins with the first word of the translation and ends with the last word of the translation. No preamble. No summary. No metadata. Only the translated text.

TEXT TO TRANSLATE:

${content}`;
}

// Streams a translation and calls onChunk for each text piece
export async function streamTranslation(
  sourceLanguage: string,
  targetLanguage: string,
  content: string,
  onChunk: (text: string) => void
): Promise<string> {
  const ai = getAI();
  const prompt = buildTranslationPrompt(sourceLanguage, targetLanguage, content);

  let translated = "";

  const stream = ai.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      translated += chunk.delta.text;
      onChunk(chunk.delta.text);
    }
  }

  return translated;
}
