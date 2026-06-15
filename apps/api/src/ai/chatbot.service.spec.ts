import { describe, it, expect } from "vitest";
import { ChatbotService } from "./chatbot.service";

/**
 * Regresyon: keyword matcher ESKİDEN düz `dto.message.toLowerCase()` kullanıyordu
 * (chatbot.service.ts:39). Türkçe "İ" harfi düz toLowerCase ile "i̇" (i + U+0307
 * combining dot) üretiyor → "KARTVİZİT" gibi büyük harfli girişler "kartvizit"
 * kuralını KAÇIRIYORDU ve bot generic karşılama dönüyordu. Artık `toLocaleLowerCase("tr")`
 * ile İ→i doğru çevriliyor; büyük harfli Türkçe girişler de eşleşmeli.
 */
describe("ChatbotService.chat", () => {
  const svc = new ChatbotService();

  it("regresyon: büyük harfli Türkçe 'KARTVİZİT' kartvizit kuralıyla eşleşir", async () => {
    const res = await svc.chat({ message: "KARTVİZİT fiyatı nedir" });
    expect(res.suggestedProductSlugs).toContain("kartvizit-350gr-kuse");
    expect(res.reply).toMatch(/kartvizit/i);
  });

  it("küçük harfli 'kartvizit' eşleşir (eski davranış korunur)", async () => {
    const res = await svc.chat({ message: "bir kartvizit istiyorum" });
    expect(res.suggestedProductSlugs).toContain("kartvizit-350gr-kuse");
  });

  it("eşleşme yoksa generic karşılama + boş slug döner", async () => {
    const res = await svc.chat({ message: "merhaba" });
    expect(res.suggestedProductSlugs).toEqual([]);
    expect(res.reply).toContain("nasıl yardımcı");
  });

  it("sessionId verilmezse yeni UUID üretir, verilirse korunur", async () => {
    const created = await svc.chat({ message: "fiyat" });
    expect(created.sessionId).toMatch(/^[0-9a-f-]{36}$/);

    const kept = await svc.chat({ message: "fiyat", sessionId: "sess-123" });
    expect(kept.sessionId).toBe("sess-123");
  });
});
