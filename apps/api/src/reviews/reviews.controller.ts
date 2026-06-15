import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ReviewsService } from "./reviews.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { SetApprovalDto } from "./reviews.dto";

@ApiTags("reviews")
@Controller("reviews")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class ReviewsController {
  constructor(private service: ReviewsService) {}

  @Get()
  list(@Query("status") status?: string) {
    const approved =
      status === "pending" ? false : status === "approved" ? true : undefined;
    return this.service.findAll({ approved });
  }

  @Patch(":id/approval")
  setApproval(@Param("id") id: string, @Body() dto: SetApprovalDto) {
    return this.service.setApproval(id, dto.isApproved);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
