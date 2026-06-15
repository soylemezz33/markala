import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { SemanticSearchService } from "./semantic-search.service";
import { DesignQualityService } from "./design-quality.service";
import { ChatbotService } from "./chatbot.service";
import { DescriptionGeneratorService } from "./description-generator.service";

@Module({
  controllers: [AiController],
  providers: [SemanticSearchService, DesignQualityService, ChatbotService, DescriptionGeneratorService],
  exports: [SemanticSearchService, DesignQualityService, ChatbotService, DescriptionGeneratorService],
})
export class AiModule {}
