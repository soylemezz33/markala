import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CampaignPackagesService } from "./campaign-packages.service";

/**
 * Kampanya paketleri — PUBLIC (storefront). Yalnız aktif paketler.
 * Admin CRUD ayrı korumalı controller'da (/campaign-packages root + POST/PATCH/DELETE).
 * Yol farklı (/campaign-packages/active) → admin @Get() ile çakışmaz.
 */
@ApiTags("campaign-packages")
@Controller("campaign-packages")
export class CampaignPackagesPublicController {
  constructor(private service: CampaignPackagesService) {}

  @Get("active")
  active() {
    return this.service.findActive();
  }
}
