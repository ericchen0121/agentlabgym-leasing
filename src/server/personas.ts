import type { PersonaScript } from "@/domain/types";

export function scriptedReply(scripts: PersonaScript[], subject: string, body: string): string | null {
  const haystack = `${subject}\n${body}`.toLowerCase();
  for (const script of scripts) {
    if (script.match === "always") return script.body;
    if (script.match.startsWith("contains:")) {
      const needle = script.match.slice("contains:".length).toLowerCase();
      if (needle && haystack.includes(needle)) return script.body;
    }
  }
  return null;
}

type ChatMessage = { role: "system" | "user"; content: string };

export async function personaReply(input: {
  mode: string | undefined;
  style: string;
  facts: string;
  scripts: PersonaScript[];
  subject: string;
  body: string;
}): Promise<{ body: string; mode: "llm" | "scripted" }> {
  const fallback = scriptedReply(input.scripts, input.subject, input.body) ?? "Thanks, I got your note.";
  if (input.mode !== "llm" || !process.env.PERSONA_LLM_API_KEY) {
    return { body: fallback, mode: "scripted" };
  }
  try {
    const base = process.env.PERSONA_LLM_BASE_URL || "https://api.openai.com/v1";
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: [
          "You are a renter writing a short email reply in a fictional leasing simulation.",
          "Stay in character. Do not mention that you are a model.",
          `Voice: ${input.style}`,
          `Facts you believe: ${input.facts}`,
          "Two to six sentences. Plain text. No markdown.",
        ].join("\n"),
      },
      { role: "user", content: `Subject: ${input.subject}\n\n${input.body}` },
    ];
    const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERSONA_LLM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.PERSONA_LLM_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        messages,
      }),
    });
    if (!response.ok) return { body: fallback, mode: "scripted" };
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) return { body: fallback, mode: "scripted" };
    return { body: text, mode: "llm" };
  } catch {
    return { body: fallback, mode: "scripted" };
  }
}
