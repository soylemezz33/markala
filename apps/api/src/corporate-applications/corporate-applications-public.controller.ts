import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CorporateApplicationsService } from "./corporate-applications.service";
import { CreateCorporateApplicationDto } from "./corporate-applications.dto";

/**
 * Public kurumsal başvuru — auth GEREKTİRMEZ. Storefront B2B formu buraya POST eder,
 * başvuru admin panelindeki "Kurumsal Başvurular" listesine "pending" olarak düşer.
 * (Admin GET/PATCH uçları guard'lı ayrı controller'da.)
 */
@ApiTags("corporate-applications")
@Controller("corporate-applications")
export class CorporateApplicationsPublicController {
  constructor(private service: CorporateApplicationsService) {}

  @Post()
  create(@Body() dto: CreateCorporateApplicationDto) {
    return this.service.create(dto);
  }
}
