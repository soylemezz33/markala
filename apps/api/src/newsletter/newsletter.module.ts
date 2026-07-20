import { Module } from "@nestjs/common";
import { NewsletterController, NewsletterPublicController } from "./newsletter.controller";
import { NewsletterService } from "./newsletter.service";

@Module({
  controllers: [NewsletterController, NewsletterPublicController],
  providers: [NewsletterService],
  // buildUnsubscribeUrl ileride kampanya maili gönderen modüllerce kullanılacak.
  exports: [NewsletterService],
})
export class NewsletterModule {}
