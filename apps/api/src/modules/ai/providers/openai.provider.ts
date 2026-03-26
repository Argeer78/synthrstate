import { BadRequestException, Injectable } from "@nestjs/common";
import { AiProvider } from "./ai.provider";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
};

function tryExtractJson(text: string): any | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {}
  }

  // fallback: attempt to find the first JSON object
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

@Injectable()
export class OpenAiProvider implements AiProvider {
  async generateJson(params: {
    systemPrompt?: string;
    userPrompt: string;
    providerHint?: string;
  }): Promise<{ json: any }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new BadRequestException("OPENAI_API_KEY not configured");

    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

    // Keep output strict JSON to simplify parsing/validation.
    const messages: Array<{ role: "system" | "user"; content: string }> = [];
    if (params.systemPrompt) messages.push({ role: "system", content: params.systemPrompt });
    messages.push({ role: "user", content: params.userPrompt });

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new BadRequestException(`OpenAI error: ${resp.status} ${text.slice(0, 300)}`);
    }

    const data = (await resp.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new BadRequestException("OpenAI returned empty content");

    const json = tryExtractJson(content);
    if (!json || typeof json !== "object") throw new BadRequestException("OpenAI output is not valid JSON");
    return { json };
  }
}

