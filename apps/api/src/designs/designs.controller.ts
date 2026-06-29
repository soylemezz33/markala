import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { OptionalJwtAuthGuard } from "./optional-jwt.guard";
import { ClaimDesignsDto, CreateDesignDto, UpdateDesignDto } from "./designs.dto";
import { DesignsService } from "./designs.service";

type AuthedReq = { user?: { sub?: string } };
const uid = (req: AuthedReq) => req.user?.sub;

@Controller("designs")
export class DesignsController {
  constructor(private readonly svc: DesignsService) {}

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
}
