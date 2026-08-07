export interface AiCompletionUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface AiCompletionResult {
  content: string;
  usage: AiCompletionUsage;
}

export interface AiProvider {
  complete(params: { system: string; user: string }): Promise<AiCompletionResult>;
}

export class MockAiProvider implements AiProvider {
  async complete(params: { system: string; user: string }): Promise<AiCompletionResult> {
    const isGenerate = params.user.toLowerCase().includes("generate");
    const content = isGenerate
      ? "query GetUsers {\n  users {\n    id\n    name\n  }\n}"
      : "## Explanation\n\nThis operation queries the `users` field on the `Query` root type.\n\n**Citations:** Query.users";
    return {
      content,
      usage: { promptTokens: 42, completionTokens: 18 },
    };
  }
}

export class OpenAiProvider implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = "gpt-4o-mini",
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async complete(params: { system: string; user: string }): Promise<AiCompletionResult> {
    const res = await this.fetchFn("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("OpenAI returned empty response");

    return {
      content,
      usage: {
        promptTokens: json.usage?.prompt_tokens ?? 0,
        completionTokens: json.usage?.completion_tokens ?? 0,
      },
    };
  }
}

export function resolveAiProvider(apiKey: string | null): AiProvider {
  const mode = process.env.GRAPHSCOPE_AI_PROVIDER ?? (process.env.NODE_ENV === "test" ? "mock" : "openai");
  if (mode === "mock" || !apiKey) {
    return new MockAiProvider();
  }
  return new OpenAiProvider(apiKey);
}
