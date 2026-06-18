import { Module } from "@nestjs/common";
import { ReviewsController } from "./reviews.controller";
import { ReviewsPublicController } from "./reviews-public.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  // PublicController önce: /reviews/public, admin /reviews kökünden ayrı kalsın.
  controllers: [ReviewsPublicController, ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
