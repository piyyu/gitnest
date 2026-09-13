import Groq from "groq-sdk";

// Plan = cheap/fast JSON outline; chapter = bigger model for long-form tutorials.
const PLAN_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "moonshotai/kimi-k2-instruct-0905",
];

const CHAPTER_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "moonshotai/kimi-k2-instruct-0905",
];

function parseList(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

export type GroqTask = "plan" | "chapter";

export function getModelsFor(task?: GroqTask): string[] {
  // Per-task override wins: GROQ_MODEL_PLAN / GROQ_MODEL_CHAPTER
  if (task === "plan") {
    const fromTaskEnv = parseList(process.env.GROQ_MODEL_PLAN);
    if (fromTaskEnv.length > 0) return fromTaskEnv;
  }
  if (task === "chapter") {
    const fromTaskEnv = parseList(process.env.GROQ_MODEL_CHAPTER);
    if (fromTaskEnv.length > 0) return fromTaskEnv;
  }
  // Global override for both routes
  const fromGlobal = parseList(process.env.GROQ_MODEL);
  if (fromGlobal.length > 0) return fromGlobal;
  if (task === "chapter") return CHAPTER_MODELS;
  return PLAN_MODELS;
}

export function getConfiguredModels(): string[] {
  return getModelsFor();
}

function getGroq(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }
  return new Groq({ apiKey });
}

function isModelNotFoundError(error: any): boolean {
  const code = error?.error?.code || error?.code;
  const status = error?.status;
  const msg = String(error?.error?.message || error?.message || "");
  return (
    code === "model_not_found" ||
    code === "model_decommissioned" ||
    status === 404 ||
    /does not exist|decommissioned|not found/i.test(msg)
  );
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type StreamCallbacks = {
  onToken?: (token: string) => void;
  signal?: AbortSignal;
};

export async function chatCompletion(
  messages: ChatMessage[],
  opts?: { temperature?: number; max_tokens?: number; task?: GroqTask }
) {
  const groq = getGroq();
  const models = getModelsFor(opts?.task);
  let lastError: any = null;

  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature: opts?.temperature ?? 0.5,
        ...(opts?.max_tokens ? { max_tokens: opts.max_tokens } : {}),
        messages,
      });
      return { completion, model };
    } catch (error: any) {
      lastError = error;
      if (isModelNotFoundError(error)) {
        console.error(
          `Groq model "${model}" unavailable, trying fallback...`,
          error?.error?.message || error?.message
        );
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("No Groq models available");
}

// Streaming variant: yields tokens as they arrive so the UI can render
// progressively instead of waiting for the full completion (~10-20s).
// Falls back to the next model only on model-not-found, same as chatCompletion.
export async function streamChatCompletion(
  messages: ChatMessage[],
  opts?: { temperature?: number; max_tokens?: number; task?: GroqTask } & StreamCallbacks
) {
  const groq = getGroq();
  const models = getModelsFor(opts?.task);
  let lastError: any = null;

  for (const model of models) {
    try {
      const stream = await groq.chat.completions.create({
        model,
        temperature: opts?.temperature ?? 0.5,
        ...(opts?.max_tokens ? { max_tokens: opts.max_tokens } : {}),
        messages,
        stream: true,
      });
      let fullText = "";
      for await (const chunk of stream) {
        if (opts?.signal?.aborted) break;
        const token = (chunk as any)?.choices?.[0]?.delta?.content || "";
        if (token) {
          fullText += token;
          opts?.onToken?.(token);
        }
      }
      return { content: fullText, model };
    } catch (error: any) {
      lastError = error;
      if (isModelNotFoundError(error)) {
        console.error(
          `Groq model "${model}" unavailable (stream), trying fallback...`,
          error?.error?.message || error?.message
        );
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("No Groq models available");
}
