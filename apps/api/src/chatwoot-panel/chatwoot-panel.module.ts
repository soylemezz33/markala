import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ChatwootPanelController } from "./chatwoot-panel.controller";
import { ChatwootPanelService } from "./chatwoot-panel.service";

// PrismaModule bu projede @Global — ayrıca import etmek gerekmiyor.
// AuthModule: ajan girişi için AuthService (şifre doğrulama) + JwtModule (panel token'ı).
@Module({
  imports: [AuthModule],
  controllers: [ChatwootPanelController],
  providers: [ChatwootPanelService],
})
export class ChatwootPanelModule {}
