import { Module } from "@nestjs/common";
import { CorporateApplicationsController } from "./corporate-applications.controller";
import { CorporateApplicationsPublicController } from "./corporate-applications-public.controller";
import { CorporateApplicationsService } from "./corporate-applications.service";
import { MailModule } from "../mail/mail.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [MailModule, StorageModule],
  // Public controller önce: POST / (guard'sız) admin GET/PATCH'ten ayrı route'lar.
  controllers: [CorporateApplicationsPublicController, CorporateApplicationsController],
  providers: [CorporateApplicationsService],
})
export class CorporateApplicationsModule {}
