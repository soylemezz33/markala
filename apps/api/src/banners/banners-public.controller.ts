import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BannersService } from "./banners.service";

/**
 * Storefront banner okuma — PUBLIC (guard YOK). Yalnız aktif + tarih penceresi içindeki banner'lar.
 * Admin BannersController (guard'lı) ayrı; bu controller yalnız okuma sunar.
 */
@ApiTags("banners")
@Controller("banners")
export class BannersPublicController {
  constructor(private service: BannersService) {}

  @Get("public")
  listPublic() {
    return this.service.findActivePublic();
  }
}
