/**
 * İnce Claude (Anthropic) istemcisi — resmi SDK yerine `fetch` ile.
 *
 * Neden SDK değil:
 *   - pnpm-lock.yaml'a ağır bağımlılık eklemeden, denetlenebilir tek dosya.
 *   - Maliyet/KVKK kontrolü bizde: hangi alan ne zaman gönderiliyor net.
 *
 * KVKK notu: Bu istemciye yalnızca ürün metası (ad, kategori, anahtar kelime)
 * gönderilir. Kişisel veri (TC, telefon, e-posta) ASLA prompt'a konmaz.
 *
 * Maliyet notu: Varsayılan model maliyet-odaklı `claude-haiku-4-5`. Üst kalite
 * için ANTHROPIC_MODEL ile override edilir. Her çağrı `usage` döndürür; çağıran
 * `estimateCostUsd` ile maliyeti loglayabilir.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/** Maliyet-odaklı varsayılan (rol gereği "maliyet izleme" önceliği). */
const DEFAULT_MODEL = "claude-haiku-4-5";
/** Güvenlik tavanı — runaway maliyeti engeller. */
const MAX_TOKENS_CEILING = 2048;
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TIMEOUT_MS = 20_000;

/** Bilinen modeller için USD / 1M token (input, output). */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-opus-4-8": { input: 5, output: 25 },
};

export interface ClaudeUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ClaudeResult {
  text: string;
  usage: ClaudeUsage;
  model: string;
}

export interface ClaudeRequest {
  /** Sistem yönergesi (rol/ton/kısıt). */
  system?: string;
  /** Kullanıcı prompt'u (ürün metası — PII içermez). */
  prompt: string;
  /** Çıktı token tavanı (MAX_TOKENS_CEILING ile kırpılır). */
  maxTokens?: number;
  /** Yapısal çıktı için JSON Schema (output_config.format). */
  jsonSchema?: Record<string, unknown>;
  timeoutMs?: number;
}

/** ANTHROPIC_API_KEY yokken atılır — çağıran fallback'e düşmeli. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY tanımlı değil — AI çağrısı atlandı.");
    this.name = "AiNotConfiguredError";
  }
}

/** API hata/refusal durumunda atılır. */
export class AiRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
  }
}

/** API anahtarı tanımlı mı? (env her çağrıda tembel okunur — build'i etkilemez.) */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** Aktif model — ANTHROPIC_MODEL override, yoksa maliyet-odaklı varsayılan. */
export function getAiModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

/** usage + model'den yaklaşık USD maliyet. Bilinmeyen model haiku oranıyla tahmin edilir. */
export function estimateCostUsd(usage: ClaudeUsage, model: string): number {
  const rate = PRICING[model] ?? PRICING[DEFAULT_MODEL]!;
  return (
    (usage.inputTokens * rate.input + usage.outputTokens * rate.output) / 1_000_000
  );
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  model?: string;
  stop_reason?: string;
}

/**
 * Claude Messages API'ye tek atımlık çağrı.
 * @throws AiNotConfiguredError anahtar yoksa
 * @throws AiRequestError API hatası, refusal veya boş yanıtta
 */
export async function generateText(req: ClaudeRequest): Promise<ClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new AiNotConfiguredError();

  const model = getAiModel();
  const maxTokens = Math.min(req.maxTokens ?? DEFAULT_MAX_TOKENS, MAX_TOKENS_CEILING);

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: req.prompt }],
  };
  if (req.system) body.system = req.system;
  if (req.jsonSchema) {
    body.output_config = { format: { type: "json_schema", schema: req.jsonSchema } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new AiRequestError(
      `AI isteği başarısız: ${(err as Error).message}`,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AiRequestError(`AI API ${res.status}: ${detail.slice(0, 200)}`, res.status);
  }

  const data = (await res.json()) as AnthropicResponse;

  if (data.stop_reason === "refusal") {
    throw new AiRequestError("AI isteği güvenlik nedeniyle reddedildi (refusal).");
  }

  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("")
    .trim();

  if (!text) throw new AiRequestError("AI boş yanıt döndü.");

  return {
    text,
    usage: {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    },
    model: data.model ?? model,
  };
}
