import { Module } from "@nestjs/common";
import { CampaignPackagesController } from "./campaign-packages.controller";
import { CampaignPackagesService } from "./campaign-packages.service";

@Module({
  controllers: [CampaignPackagesController],
  providers: [CampaignPackagesService],
})
export class CampaignPackagesModule {}
