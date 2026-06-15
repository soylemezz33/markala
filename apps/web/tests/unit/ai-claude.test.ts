import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isAiConfigured,
  getAiModel,
  estimateCostUsd,
  generateText,
  AiNotConfiguredError,
  AiRequestError,
} from "@/lib/ai/claude";

/**
 * Claude istemcisi — yapılandırma, maliyet tahmini, istek şekli ve hata yolları.
 * Ağ yok: global.fetch mock'lanır; env her testte izole edilir.
 */

const KEY = "ANTHROPIC_API_KEY";
const MODEL_ENV = "ANTHROPIC_MODEL";

function okResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as unknown as Response;
}

describe("isAiConfigured / getAiModel", () => {
  beforeEach(() => {
    delete process.env[KEY];
    delete process.env[MODEL_ENV];
  });

  it("anahtar yoksa false, varsa true", () => {
    expect(isAiConfigured()).toBe(false);
    process.env[KEY] = "sk-test";
    expect(isAiConfigured()).toBe(true);
  });

  it("boş/whitespace anahtar yapılandırılmamış sayılır", () => {
    process.env[KEY] = "   ";
    expect(isAiConfigured()).toBe(false);
  });

  it("varsayılan model maliyet-odaklı haiku, env override eder", () => {
    expect(getAiModel()).toBe("claude-haiku-4-5");
    process.env[MODEL_ENV] = "claude-opus-4-8";
    expect(getAiModel()).toBe("claude-opus-4-8");
  });
});

describe("estimateCostUsd", () => {
  it("bilinen model için doğru hesaplar (haiku in $1 / out $5 per 1M)", () => {
    const cost = estimateCostUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, "claude-haiku-4-5");
    expect(cost).toBeCloseTo(6, 6);
  });

  it("bilinmeyen model haiku oranına düşer", () => {
    const cost = estimateCostUsd({ inputTokens: 1_000_000, outputTokens: 0 }, "gizli-model");
    expect(cost).toBeCloseTo(1, 6);
  });
});

describe("generateText", () => {
  beforeEach(() => {
    delete process.env[MODEL_ENV];
    process.env[KEY] = "sk-test";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env[KEY];
  });

  it("anahtar yoksa AiNotConfiguredError atar (fetch çağrılmaz)", async () => {
    delete process.env[KEY];
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(generateText({ prompt: "x" })).rejects.toBeInstanceOf(AiNotConfiguredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("doğru endpoint/başlık/gövde ile çağırır ve metni parse eder", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({
        content: [{ type: "text", text: "Merhaba" }],
        usage: { input_tokens: 10, output_tokens: 4 },
        model: "claude-haiku-4-5",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await generateText({ system: "S", prompt: "P", maxTokens: 256 });

    expect(res.text).toBe("Merhaba");
    expect(res.usage).toEqual({ inputTokens: 10, outputTokens: 4 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("sk-test");
    expect(headers["anthropic-version"]).toBe("2023-06-01");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe("claude-haiku-4-5");
    expect(body.max_tokens).toBe(256);
    expect(body.system).toBe("S");
    expect(body.messages).toEqual([{ role: "user", content: "P" }]);
    expect(body.output_config).toBeUndefined();
  });

  it("jsonSchema verilince output_config gönderir", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({ content: [{ type: "text", text: "{}" }], usage: {}, model: "m" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateText({ prompt: "P", jsonSchema: { type: "object" } });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.output_config).toEqual({
      format: { type: "json_schema", schema: { type: "object" } },
    });
  });

  it("maxTokens tavanı (2048) ile kırpılır", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({ content: [{ type: "text", text: "x" }], usage: {}, model: "m" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateText({ prompt: "P", maxTokens: 99_999 });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.max_tokens).toBe(2048);
  });

  it("API non-ok yanıtında AiRequestError atar (status taşır)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "rate limited",
      } as unknown as Response),
    );
    const err = await generateText({ prompt: "P" }).catch((e) => e);
    expect(err).toBeInstanceOf(AiRequestError);
    expect(err.status).toBe(429);
  });

  it("refusal stop_reason'da AiRequestError atar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okResponse({ content: [], stop_reason: "refusal", usage: {}, model: "m" }),
      ),
    );
    await expect(generateText({ prompt: "P" })).rejects.toBeInstanceOf(AiRequestError);
  });

  it("boş metin yanıtında AiRequestError atar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(okResponse({ content: [], usage: {}, model: "m" })),
    );
    await expect(generateText({ prompt: "P" })).rejects.toBeInstanceOf(AiRequestError);
  });
});
