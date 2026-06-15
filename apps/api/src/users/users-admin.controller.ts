import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("admin-users")
@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class UsersAdminController {
  constructor(private service: UsersService) {}

  @Get()
  list(@Query("take") take?: string, @Query("skip") skip?: string, @Query("q") q?: string) {
    return this.service.listForAdmin({
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
      q,
    });
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.service.getForAdmin(id);
  }
}
