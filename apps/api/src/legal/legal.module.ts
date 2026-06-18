import { Module } from "@nestjs/common";
import { LegalController } from "./legal.controller";
import { LegalPublicController } from "./legal-public.controller";
import { LegalService } from "./legal.service";

@Module({
  // PublicController önce: /legal/public, admin /legal/:slug tarafından yakalanmasın.
  controllers: [LegalPublicController, LegalController],
  providers: [LegalService],
})
export class LegalModule {}
