import { Module } from "@nestjs/common";
import { MailModule } from "../mail/mail.module";
import { InternalNotifyController } from "./internal-notify.controller";

@Module({
  imports: [MailModule],
  controllers: [InternalNotifyController],
})
export class InternalNotifyModule {}
