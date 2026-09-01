import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { FavoritesService } from "./favorites.service";
import { MergeFavoritesDto } from "./favorites.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import type { Request } from "express";

type AuthedRequest = Request & { user: { sub: string } };

/**
 * Favoriler yalnız GİRİŞLİ kullanıcıya açık (2026-09-01, Hasan).
 * SECURITY: her sorgu req.user.sub ile daraltılır — başkasının listesine erişim yok (IDOR).
 */
@ApiTags("favorites")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users/me/favorites")
export class FavoritesController {
  constructor(private service: FavoritesService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.service.list(req.user.sub);
  }

  /** Girişte cihazdaki eski listeyi hesaba taşır. ":slug" rotasından ÖNCE tanımlı olmalı değil —
   *  metodu farklı (POST), çakışma yok; yine de okunurluk için üstte duruyor. */
  @Post("merge")
  merge(@Req() req: AuthedRequest, @Body() dto: MergeFavoritesDto) {
    return this.service.merge(req.user.sub, dto.slugs);
  }

  @Put(":slug")
  add(@Req() req: AuthedRequest, @Param("slug") slug: string) {
    return this.service.add(req.user.sub, slug);
  }

  @Delete(":slug")
  remove(@Req() req: AuthedRequest, @Param("slug") slug: string) {
    return this.service.remove(req.user.sub, slug);
  }
}
