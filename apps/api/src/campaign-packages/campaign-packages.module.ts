import { Module } from "@nestjs/common";
import { CampaignPackagesController } from "./campaign-packages.controller";
import { CampaignPackagesPublicController } from "./campaign-packages-public.controller";
import { CampaignPackagesService } from "./campaign-packages.service";

@Module({
  // Public controller önce: /campaign-packages/active (admin @Get() root ile çakışmaz).
  controllers: [CampaignPackagesPublicController, CampaignPackagesController],
  providers: [CampaignPackagesService],
})
export class CampaignPackagesModule {}
