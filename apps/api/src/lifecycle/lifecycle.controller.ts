import { BadRequestException, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { RetentionService } from "./retention.service";

/**
 * Sadakat cron işlerini ELLE tetikleme — yalnız super_admin (2026-09-06).
 * Amaç: canlıda saatlik/günlük cron'u beklemeden kontrollü test ve doğrulama. İşler idempotent
 * (aşama alanları) olduğundan elle tetiklemek çift mail üretmez.
 *   POST /lifecycle/run/ikinci-siparis · /tekrar-siparis · /puan-suresi
 */
@ApiTags("lifecycle")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
@Controller("lifecycle")
export class LifecycleController {
  constructor(private retention: RetentionService) {}

  @Post("run/:job")
  async run(@Param("job") job: string) {
    switch (job) {
      case "ikinci-siparis": return { job, ...(await this.retention.runIkinciSiparis()) };
      case "tekrar-siparis": return { job, ...(await this.retention.runTekrarSiparis()) };
      case "puan-suresi": return { job, ...(await this.retention.runPuanSuresi()) };
      default: throw new BadRequestException("Bilinmeyen iş: ikinci-siparis | tekrar-siparis | puan-suresi");
    }
  }
}
