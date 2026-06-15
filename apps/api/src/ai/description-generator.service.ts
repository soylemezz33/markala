import { Injectable, Logger } from "@nestjs/common";
import { GenerateDescriptionDto, GenerateDescriptionResultDto } from "./ai.dto";

/**
 * Ürün açıklaması taslak üretici (PoC) + Claude-hazır sağlayıcı arabirimi.
 *
 * Bugün: deterministik, Türkçe, matbaa-duyarlı ŞABLON üretici → admin için
 * "taslak başlatıcı". Dış AI çağrısı YOK → maliyet 0, KVKK m.9 riski 0.
 *
 * Prod yükseltme (tek dosya değişimi): `ANTHROPIC_API_KEY` set olduğunda
 * Claude Haiku 4.5 sağlayıcısı `generate()` içinde devreye alınır.
 *
 * KVKK + maliyet tasarımı (prod sağlayıcı için bağlayıcı):
 *  - Sağlayıcıya YALNIZCA ürün metadata'sı (ad, kategori, anahtar kelime) gider;
 *    müşteri PII'si ASLA gönderilmez (girdi DTO'su zaten PII taşımaz).
 *  - Üretilen taslak `Product.content` alanında cache'lenir → aynı ürün için
 *    tekrar token maliyeti oluşmaz (admin "yeniden üret" demedikçe).
 *  - Çıktı taslaktır; admin onayı olmadan yayına çıkmaz (insan-in-the-loop).
 */
@Injectable()
export class DescriptionGeneratorService {
  private readonly logger = new Logger(DescriptionGeneratorService.name);

  /** Product.shortDescription DTO kısıtı ile uyumlu üst sınır. */
  private readonly SHORT_MAX = 280;

  async generate(dto: GenerateDescriptionDto): Promise<GenerateDescriptionResultDto> {
    const tone = dto.tone ?? "kurumsal";
    this.logger.log(`[template] generate name="${dto.name}" tone=${tone}`);

    // Prod seam: `if (process.env.ANTHROPIC_API_KEY) return this.callClaude(dto)`
    // — sağlayıcı yokken deterministik şablona güvenli düşüş (graceful degradation).
    const content = this.buildTemplate(dto, tone);

    return {
      ...content,
      provider: "template",
      model: null,
    };
  }

  /** Deterministik Türkçe taslak — ad + kategori + anahtar kelimelerden. */
  private buildTemplate(
    dto: GenerateDescriptionDto,
    tone: "kurumsal" | "samimi",
  ): Pick<GenerateDescriptionResultDto, "shortDescription" | "description" | "faqs"> {
    const name = dto.name.trim();
    const category = dto.categoryName?.trim();
    const keywords = (dto.keywords ?? []).map((k) => k.trim()).filter(Boolean);

    const categoryPhrase = category ? `${category} kategorisinde ` : "";
    const opener = tone === "samimi" ? "Siz de" : "Firmanız için";

    const shortDescription = this.clampShort(
      `${name}, ${categoryPhrase}profesyonel baskı kalitesi ve hızlı teslimat ile markanızı öne çıkarır.`,
    );

    const keywordSentence =
      keywords.length > 0
        ? ` Öne çıkan özellikler: ${keywords.join(", ")}.`
        : "";

    const description = [
      `${opener} ${name} ürünümüz, ${categoryPhrase}yüksek çözünürlüklü baskı ve özenli işçilikle hazırlanır.`,
      `Kurumsal kimliğinize uygun, dayanıklı malzeme ve canlı renklerle profesyonel bir izlenim bırakır.${keywordSentence}`,
      `Online tasarım onayı sonrası üretime alınır; siparişiniz özenle paketlenip kapınıza ulaştırılır.`,
    ].join(" ");

    const faqs = [
      {
        q: `${name} için minimum sipariş adedi nedir?`,
        a: "Minimum adet ürün ve baskı tipine göre değişir; ürün sayfasındaki konfigüratörden anlık görebilirsiniz.",
      },
      {
        q: "Hangi dosya formatında tasarım yükleyebilirim?",
        a: "PDF, AI veya yüksek çözünürlüklü (300 DPI) PNG/JPG kabul edilir; baskı kalitesi için CMYK ve 3mm kesim payı önerilir.",
      },
      {
        q: "Teslimat ne kadar sürer?",
        a: "Tasarım onayı sonrası üretim ve kargo süresi ürün sayfasında belirtilir; acil siparişler için bizimle iletişime geçebilirsiniz.",
      },
    ];

    return { shortDescription, description, faqs };
  }

  /** Kelime sınırında güvenli kırpma (≤280 — "…" dahil, cümle bütünlüğünü korur). */
  private clampShort(text: string): string {
    if (text.length <= this.SHORT_MAX) return text;
    const limit = this.SHORT_MAX - 1; // sonda eklenecek "…" için yer ayır
    const cut = text.slice(0, limit);
    const lastSpace = cut.lastIndexOf(" ");
    const body = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
    return body.trimEnd() + "…";
  }
}
