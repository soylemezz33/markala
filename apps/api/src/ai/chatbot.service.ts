import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ChatbotMessageDto, ChatbotResponseDto } from "./ai.dto";

/**
 * PoC stub — matbaa chatbot (ürün öneri + sipariş yönlendirme).
 *
 * Prod impl aday: Claude Haiku 4.5 (düşük latency, Türkçe güçlü)
 * system prompt: markala.com.tr ürün kataloğu + sipariş SSS
 *
 * Şu an: kural tabanlı keyword matcher döner.
 */
@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  private readonly KEYWORD_RULES: Array<{ keywords: string[]; reply: string; slugs: string[] }> = [
    {
      keywords: ["kartvizit", "kart"],
      reply: "Kartvizit siparişleri için 350gr kuşe veya mat selefon seçeneklerimiz mevcut. Hangi kağıt kalitesini tercih edersiniz?",
      slugs: ["kartvizit-350gr-kuse", "kartvizit-mat-selefon"],
    },
    {
      keywords: ["broşür", "brosur", "katalog"],
      reply: "Broşür ve katalog baskılarında A4/A5/A6 boyutlarında çözümlerimiz var. Hangi boyut sizin için uygun?",
      slugs: ["brosur-a4-katlamali", "katalog-a5"],
    },
    {
      keywords: ["fiyat", "ücret", "tutar", "maliyet"],
      reply: "Fiyatlarımız ürün, kağıt kalitesi ve adet'e göre değişiyor. Ürün sayfasından anlık teklif alabilirsiniz.",
      slugs: [],
    },
  ];

  async chat(dto: ChatbotMessageDto): Promise<ChatbotResponseDto> {
    const sessionId = dto.sessionId ?? randomUUID();
    this.logger.log(`[PoC] Chatbot session=${sessionId} message="${dto.message}"`);

    // Türkçe locale şart: düz `toLowerCase()` "İ" harfini "i̇" (i + U+0307 combining dot)
    // üretir, "KARTVİZİT" gibi büyük harfli girişler kuralları kaçırır. `tr` locale İ→i doğru çevirir.
    const lower = dto.message.toLocaleLowerCase("tr");
    const matched = this.KEYWORD_RULES.find((r) => r.keywords.some((kw) => lower.includes(kw)));

    const reply = matched
      ? matched.reply
      : "Merhaba! Size nasıl yardımcı olabilirim? Kartvizit, broşür veya diğer baskı ürünlerimiz hakkında bilgi almak ister misiniz?";

    return { sessionId, reply, suggestedProductSlugs: matched?.slugs ?? [] };
  }
}
