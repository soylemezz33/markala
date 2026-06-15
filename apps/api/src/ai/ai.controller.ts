import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SemanticSearchService } from "./semantic-search.service";
import { DesignQualityService } from "./design-quality.service";
import { ChatbotService } from "./chatbot.service";
import { DescriptionGeneratorService } from "./description-generator.service";
import {
  SemanticSearchDto,
  DesignQualityCheckDto,
  ChatbotMessageDto,
  GenerateDescriptionDto,
} from "./ai.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";

@ApiTags("ai")
@Controller("ai")
export class AiController {
  constructor(
    private readonly searchService: SemanticSearchService,
    private readonly designService: DesignQualityService,
    private readonly chatbotService: ChatbotService,
    private readonly descriptionService: DescriptionGeneratorService,
  ) {}

  @Post("search")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Semantik ürün arama (PoC)", description: "Doğal dil sorgusu ile ilgili matbaa ürünlerini listeler." })
  search(@Body() dto: SemanticSearchDto) {
    return this.searchService.search(dto);
  }

  @Post("design-check")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tasarım kalite kontrolü (PoC)", description: "Yüklenen tasarım dosyasının DPI ve kesim payı kontrolünü yapar." })
  checkDesign(@Body() dto: DesignQualityCheckDto) {
    return this.designService.check(dto);
  }

  @Post("chat")
  @ApiOperation({ summary: "Chatbot (PoC)", description: "Ürün öneri ve sipariş yönlendirme chatbotu. Auth opsiyonel." })
  chat(@Body() dto: ChatbotMessageDto) {
    return this.chatbotService.chat(dto);
  }

  @Post("generate-description")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Ürün açıklaması taslağı üret (PoC)",
    description: "Ürün adı + kategoriden Türkçe açıklama/SSS taslağı üretir (admin içi, insan onaylı).",
  })
  generateDescription(@Body() dto: GenerateDescriptionDto) {
    return this.descriptionService.generate(dto);
  }
}
