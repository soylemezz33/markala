import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiQuery } from "@nestjs/swagger";
import type { Request } from "express";
import { CorporateApplicationsService } from "./corporate-applications.service";
import { ReviewCorporateDto } from "./corporate-applications.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("corporate-applications")
@Controller("corporate-applications")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class CorporateApplicationsController {
  constructor(private service: CorporateApplicationsService) {}

  @Get()
  @ApiQuery({ name: "status", required: false })
  list(@Query("status") status?: string) {
    return this.service.findAll(status);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  review(
    @Param("id") id: string,
    @Body() dto: ReviewCorporateDto,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.service.review(id, req.user.sub, dto.status, dto.reviewNote);
  }
}
