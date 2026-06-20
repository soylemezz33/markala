import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { ReviewsService } from "./reviews.service";
import { CreatePublicReviewDto } from "./reviews.dto";

/**
 * Storefront'a AÇIK yorum okuma + giriş yapmış müşteri yorum bırakma.
 * Admin ReviewsController class-level guard'lı; bu ayrı public controller yalnız ONAYLANMIŞ yorumları döner.
 * Prefix /reviews/public admin /reviews kökünden ayrıdır.
 */
@ApiTags("reviews")
@Controller("reviews/public")
export class ReviewsPublicController {
  constructor(private service: ReviewsService) {}

  /** Anasayfa öne çıkan onaylanmış yorumlar (ürün-bağımsız). Yoksa boş dizi döner. */
  @Get("featured")
  featured(@Query("limit") limit?: string) {
    const n = Number(limit);
    return this.service.findFeaturedApproved(Number.isFinite(n) && n > 0 ? n : 6);
  }

  /** Bir ürünün onaylanmış yorumları. productSlug zorunlu; yoksa 400. */
  @Get()
  list(@Query("productSlug") productSlug?: string) {
    if (!productSlug) {
      throw new BadRequestException("productSlug parametresi zorunludur.");
    }
    return this.service.findApprovedByProductSlug(productSlug);
  }

  /** Giriş yapmış müşteri yorum bırakır — yorum onaysız (pending) doğar, moderasyondan geçer. */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: CreatePublicReviewDto,
  ) {
    return this.service.createPublic({
      userId: req.user.sub,
      productSlug: dto.productSlug,
      rating: dto.rating,
      title: dto.title,
      body: dto.body,
    });
  }
}
