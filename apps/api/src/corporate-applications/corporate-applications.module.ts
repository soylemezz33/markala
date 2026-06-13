import { Module } from "@nestjs/common";
import { CorporateApplicationsController } from "./corporate-applications.controller";
import { CorporateApplicationsService } from "./corporate-applications.service";

@Module({
  controllers: [CorporateApplicationsController],
  providers: [CorporateApplicationsService],
})
export class CorporateApplicationsModule {}
