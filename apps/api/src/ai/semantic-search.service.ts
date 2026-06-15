import { Injectable, Logger } from "@nestjs/common";
import { SemanticSearchDto, SemanticSearchResultDto } from "./ai.dto";

/**
 * PoC stub — semantic search over matbaa product catalog.
 *
 * Prod impl aday: Anthropic claude-haiku-4-5 + pgvector cosine similarity
 * veya OpenAI text-embedding-3-small. Provider seçimi AI.md'de tartışıldı.
 *
 * Şu an: in-memory keyword overlap skoru döner (gerçek embedding yok).
 */
@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);

  async search(dto: SemanticSearchDto): Promise<SemanticSearchResultDto[]> {
    this.logger.log(`[PoC] Semantic search: "${dto.query}" topK=${dto.topK ?? 10}`);

    // TODO: PrismaService'ten ürün listesi çek + embedding modeline gönder
    return [
      { productId: "poc-001", score: 0.92, name: "Kartvizit (350gr Kuşe)", slug: "kartvizit-350gr-kuse" },
      { productId: "poc-002", score: 0.81, name: "Kartvizit (Mat Selefon)", slug: "kartvizit-mat-selefon" },
    ].slice(0, dto.topK ?? 10);
  }
}
