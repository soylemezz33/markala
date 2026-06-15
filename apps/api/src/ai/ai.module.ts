import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { SemanticSearchService } from "./semantic-search.service";
import { DesignQualityService } from "./design-quality.service";
import { ChatbotService } from "./chatbot.service";

@Module({
  controllers: [AiController],
  providers: [SemanticSearchService, DesignQualityService, ChatbotService],
  exports: [SemanticSearchService, DesignQualityService, ChatbotService],
})
export class AiModule {}
