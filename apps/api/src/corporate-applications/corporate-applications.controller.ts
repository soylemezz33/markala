import { Controller, Get, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CorporateApplicationsService } from "./corporate-applications.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { SetCorporateStatusDto } from "./corporate-applications.dto";

@ApiTags("corporate-applications")
@Controller("corporate-applications")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class CorporateApplicationsController {
  constructor(private service: CorporateApplicationsService) {}

  @Get()
  list(@Query("status") status?: string) {
    return this.service.findAll(status);
  }

  @Patch(":id")
  setStatus(@Param("id") id: string, @Body() dto: SetCorporateStatusDto) {
    return this.service.setStatus(id, dto.status, dto.reviewNote);
  }
}
