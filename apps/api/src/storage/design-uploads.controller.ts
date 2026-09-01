import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiConsumes, ApiBearerAuth } from "@nestjs/swagger";
import type { Response } from "express";
import { StorageService } from "./storage.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM } from "../auth/permissions";

/**
 * Müşteriye AÇIK (guard YOK) tasarım dosyası yükleme — checkout öncesi konfigüratörden çağrılır.
 * Tip/boyut doğrulaması StorageService.putDesign içinde (uzantı whitelist + 50MB).
 * multer 52MB hard limit = 50MB iş kuralının üstünde son emniyet.
 * Kötüye kullanım koruması: main.ts'te per-IP rate limit (40/saat).
 *
 * NOT: Admin UploadsController ile aynı "uploads" prefix; farklı alt-path (/uploads/design) çakışmaz.
 */
@ApiTags("uploads")
@Controller("uploads")
export class DesignUploadsController {
  constructor(private storage: StorageService) {}

  @Post("design")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 52 * 1024 * 1024 } }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Dosya bulunamadı.");
    const result = await this.storage.putDesign({
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalName: file.originalname,
    });
    return {
      url: result.url,
      fileName: result.fileName,
      fileSize: result.fileSize,
      mimeType: file.mimetype,
    };
  }

  /**
   * Tasarım dosyasını indir — KORUMALI (2026-09-01).
   *
   * Eskiden bu dosyalar uploads/<uuid> altında statik serve ediliyordu: kimlik doğrulaması
   * yok, 365 gün immutable cache, URL'yi bilen herkes müşterinin baskı dosyasını (PDF/AI/PSD)
   * indirebiliyordu. Artık secure/tasarim altında duruyor ve yalnız panelde sipariş görme
   * yetkisi (ORDERS_READ) olan roller erişebiliyor — admin, tasarımcı, muhasebe, kargo.
   *
   * Müşteri tarafı ETKİLENMEZ: dosyayı yükledikten sonra web arayüzü yalnız "yüklendi"
   * bilgisini gösteriyor, dosyayı geri okumuyor (bkz. design-upload.tsx).
   */
  @Get("design/:key")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Perms(PERM.ORDERS_READ)
  @ApiBearerAuth()
  async download(@Param("key") key: string, @Res() res: Response) {
    const { buffer, mimetype } = await this.storage.getDesign(key);
    res.setHeader("Content-Type", mimetype);
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Tarayıcıda AÇMA, indir: yüklenen dosya HTML/SVG ise sayfa bağlamında çalışmasın.
    res.setHeader("Content-Disposition", `attachment; filename="${key}"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.end(buffer);
  }
}
