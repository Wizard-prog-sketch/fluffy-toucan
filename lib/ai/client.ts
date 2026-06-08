import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAI(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set in environment variables.");
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}
