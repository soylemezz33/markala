import { Body, Controller, Get, Param, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { OptionalJwtAuthGuard } from "./optional-jwt.guard";
import { ClaimDesignsDto, CreateDesignDto, RenderDesignDto, UpdateDesignDto } from "./designs.dto";
import { DesignsService } from "./designs.service";
import { RenderService } from "./render.service";

type AuthedReq = { user?: { sub?: string } };
const uid = (req: AuthedReq) => req.user?.sub;

@Controller("designs")
export class DesignsController {
  constructor(
    private readonly svc: DesignsService,
    private readonly render: RenderService,
  ) {}

  /** Public — aktif başlangıç şablonları. */
  @Get("templates/active")
  templates(@Query("category") category?: string) {
    return this.svc.listTemplates(category);
  }

  /** Tasarım kaydet (üye → userId; misafir → sessionId). */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() dto: CreateDesignDto, @Req() req: AuthedReq) {
    return this.svc.create(dto, uid(req));
  }

  /** Tasarımlarım (üye veya misafir sessionId). */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Req() req: AuthedReq, @Query("sessionId") sessionId?: string) {
    return this.svc.listMine(uid(req), sessionId);
  }

  /** Misafir tasarımlarını login sonrası hesaba bağla. */
  @Post("claim")
  @UseGuards(JwtAuthGuard)
  claim(@Body() dto: ClaimDesignsDto, @Req() req: AuthedReq) {
    return this.svc.claim(dto, uid(req) as string);
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  get(@Param("id") id: string, @Req() req: AuthedReq, @Query("sessionId") sessionId?: string) {
    return this.svc.getOwned(id, uid(req), sessionId);
  }

  @Put(":id")
  @UseGuards(OptionalJwtAuthGuard)
  update(@Param("id") id: string, @Body() dto: UpdateDesignDto, @Req() req: AuthedReq) {
    return this.svc.update(id, dto, uid(req), dto.sessionId);
  }

  /** Tasarımı baskıya-hazır CMYK PDF'e dönüştür (client 300dpi PNG gönderir). */
  @Post(":id/render")
  @UseGuards(OptionalJwtAuthGuard)
  renderDesign(@Param("id") id: string, @Body() dto: RenderDesignDto, @Req() req: AuthedReq) {
    return this.render.renderDesign(id, dto.pngBase64, { userId: uid(req), sessionId: dto.sessionId });
  }

  /** Baskı-PDF'i indir (sahiplik kontrollü — auth veya sessionId). */
  @Get(":id/print")
  @UseGuards(OptionalJwtAuthGuard)
  async print(
    @Param("id") id: string,
    @Req() req: AuthedReq,
    @Res() res: Response,
    @Query("sessionId") sessionId?: string,
  ) {
    const file = await this.render.getPrintFile(id, { userId: uid(req), sessionId });
    res.setHeader("Content-Type", file.mimetype);
    res.setHeader("Content-Disposition", 'attachment; filename="tasarim-baski.pdf"');
    res.setHeader("Cache-Control", "private, no-store");
    res.send(file.buffer);
  }
}
