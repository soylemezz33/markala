import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ContactService } from "./contact.service";
import { CreateContactDto } from "./contact.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("contact")
@Controller("contact")
export class ContactController {
  constructor(private service: ContactService) {}

  /** PUBLIC: iletişim formu mesajı → DB'ye kalıcı kayıt (rate-limit main.ts'te). */
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.service.create(dto);
  }

  /** Admin: mesaj listesi. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  list(@Query("status") status?: string) {
    return this.service.findAll({ status });
  }

  /** Admin: mesaj durumu güncelle (new | read | archived). */
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  setStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.service.setStatus(id, status);
  }
}
