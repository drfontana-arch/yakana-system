import Anthropic from "@anthropic-ai/sdk";

// Cheap, fast model — these features send short, low-stakes prompts
// (design ideas, a sanity check), not something worth a bigger model's cost.
export const AI_MODEL = "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export async function askClaude(prompt: string, maxTokens = 500): Promise<string> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error(
      "Todavía no está configurada la clave de inteligencia artificial (ANTHROPIC_API_KEY).",
    );
  }
  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

export async function askClaudeWithImageUrl(
  prompt: string,
  imageUrl: string,
  maxTokens = 500,
): Promise<string> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error(
      "Todavía no está configurada la clave de inteligencia artificial (ANTHROPIC_API_KEY).",
    );
  }
  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: imageUrl } },
          { type: "text", text: prompt },
        ],
      },
    ],
  });
  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}
