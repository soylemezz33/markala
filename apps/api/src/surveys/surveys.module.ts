import { Module } from "@nestjs/common";
import { FormbricksWebhookController } from "./formbricks-webhook.controller";
import { SurveysService } from "./surveys.service";

@Module({
  controllers: [FormbricksWebhookController],
  providers: [SurveysService],
})
export class SurveysModule {}
