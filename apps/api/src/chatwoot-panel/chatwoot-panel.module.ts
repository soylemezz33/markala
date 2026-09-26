import { Module } from "@nestjs/common";
import { ChatwootPanelController } from "./chatwoot-panel.controller";
import { ChatwootPanelService } from "./chatwoot-panel.service";

// PrismaModule bu projede @Global — ayrıca import etmek gerekmiyor.
@Module({
  controllers: [ChatwootPanelController],
  providers: [ChatwootPanelService],
})
export class ChatwootPanelModule {}
