import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiConsumes } from "@nestjs/swagger";
import { StorageService } from "./storage.service";

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
}
