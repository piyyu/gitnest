import Groq from "groq-sdk";

// Plan = cheap/fast JSON outline; chapter = speed-first (20b streams ~2-3x
// faster than 120b; quality is close enough for tutorials, 120b is fallback).
const PLAN_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "moonshotai/kimi-k2-instruct-0905",
];

const CHAPTER_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
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

function isRetryableError(error: any): boolean {
  const status = error?.status ?? error?.error?.status;
  const code = String(error?.error?.code || error?.code || "");
  const msg = String(error?.error?.message || error?.message || "");
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    code === "rate_limit_exceeded" ||
    code === "rate_limit_reached" ||
    code === "tpm_limit_exceeded" ||
    /rate limit|too many requests|tpm|temporarily|overloaded|try again/i.test(msg)
  );
}

function getRetryDelayMs(error: any, attempt: number): number {
  const headerVal =
    error?.headers?.["retry-after"] ??
    error?.error?.headers?.["retry-after"] ??
    error?.headers?.get?.("retry-after");
  const parsed = Number(headerVal);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed * 1000, 20_000);
  }
  // Exponential backoff with jitter: 1s, 2s, 4s, 8s...
  return Math.min(1000 * 2 ** attempt + Math.random() * 500, 15_000);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
    // Retry rate limits per model before falling through to the next one.
    for (let attempt = 0; attempt < 4; attempt++) {
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
          break; // next model
        }
        if (isRetryableError(error) && attempt < 3) {
          const delay = getRetryDelayMs(error, attempt);
          console.warn(
            `Groq model "${model}" rate-limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1})`
          );
          await sleep(delay);
          continue;
        }
        throw error;
      }
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
    for (let attempt = 0; attempt < 4; attempt++) {
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
          break; // next model
        }
        if (isRetryableError(error) && attempt < 3) {
          const delay = getRetryDelayMs(error, attempt);
          console.warn(
            `Groq model "${model}" rate-limited (stream), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1})`
          );
          await sleep(delay);
          continue;
        }
        throw error;
      }
    }
  }

  throw lastError ?? new Error("No Groq models available");
}
