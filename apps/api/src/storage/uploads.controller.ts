import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { StorageService } from "./storage.service";

/**
 * Admin görsel yükleme. Tip/boyut doğrulaması StorageService.put içinde (tek otorite).
 * multer 6MB hard limit = 5MB iş kuralının üstünde son emniyet.
 */
@ApiTags("uploads")
@Controller("uploads")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class UploadsController {
  constructor(private storage: StorageService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 6 * 1024 * 1024 } }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Dosya bulunamadı.");
    return this.storage.put({ buffer: file.buffer, mimetype: file.mimetype });
  }
}
