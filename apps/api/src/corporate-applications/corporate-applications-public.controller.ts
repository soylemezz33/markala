import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { CorporateApplicationsService } from "./corporate-applications.service";
import { CreateCorporateApplicationDto } from "./corporate-applications.dto";
import { StorageService } from "../storage/storage.service";
import { JwtAuthGuard } from "../auth/jwt.guard";

/**
 * Public kurumsal başvuru — auth GEREKTİRMEZ. Storefront B2B formu buraya POST eder
 * (JSON veya multipart/form-data). Vergi levhası / imza sirküleri belgeleri opsiyoneldir;
 * yüklenirse HASSAS olarak local kalıcı /uploads/secure'a yazılır (public DEĞİL) ve
 * yalnızca aşağıdaki auth-korumalı GET ile owner||admin'e açılır.
 *
 * Başvuru admin panelindeki "Kurumsal Başvurular" listesine "pending" olarak düşer.
 * (Admin GET/PATCH uçları guard'lı ayrı controller'da.)
 */
@ApiTags("corporate-applications")
@Controller("corporate-applications")
export class CorporateApplicationsPublicController {
  constructor(
    private service: CorporateApplicationsService,
    private storage: StorageService,
  ) {}

  @Post()
  @ApiConsumes("multipart/form-data", "application/json")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "taxCertificate", maxCount: 1 },
        { name: "signatureCircular", maxCount: 1 },
      ],
      { limits: { fileSize: 16 * 1024 * 1024 } },
    ),
  )
  async create(
    @Body() dto: CreateCorporateApplicationDto,
    @UploadedFiles()
    files?: {
      taxCertificate?: Express.Multer.File[];
      signatureCircular?: Express.Multer.File[];
    },
  ) {
    const docs: { taxCertificateUrl?: string; signatureCircularUrl?: string } = {};
    const tax = files?.taxCertificate?.[0];
    const sig = files?.signatureCircular?.[0];
    if (tax) {
      docs.taxCertificateUrl = (
        await this.storage.putSecure({
          buffer: tax.buffer,
          mimetype: tax.mimetype,
          originalName: tax.originalname,
        })
      ).key;
    }
    if (sig) {
      docs.signatureCircularUrl = (
        await this.storage.putSecure({
          buffer: sig.buffer,
          mimetype: sig.mimetype,
          originalName: sig.originalname,
        })
      ).key;
    }
    return this.service.create(dto, undefined, docs);
  }

  /**
   * Hassas belgeyi indir — auth ZORUNLU. service.getDocumentKey owner||admin kontrolü yapar,
   * yetkisizde/yokta 404 (varlık sızdırmaz). attachment olarak döner (inline render yok).
   */
  @Get(":id/document/:field")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async document(
    @Param("id") id: string,
    @Param("field") field: string,
    @Req() req: Request & { user: { sub: string; role: string } },
    @Res() res: Response,
  ) {
    if (field !== "tax" && field !== "signature") {
      throw new BadRequestException("Geçersiz belge türü.");
    }
    const key = await this.service.getDocumentKey(id, field, {
      userId: req.user.sub,
      role: req.user.role,
    });
    const file = await this.storage.getSecure(key);
    const ext = key.split(".").pop() ?? "bin";
    const name = field === "tax" ? "vergi-levhasi" : "imza-sirkuleri";
    res.setHeader("Content-Type", file.mimetype);
    res.setHeader("Content-Disposition", `attachment; filename="${name}.${ext}"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(file.buffer);
  }
}
