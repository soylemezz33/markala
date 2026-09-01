import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/jwt.guard";
import { RolesGuard, Roles } from "../../auth/roles.guard";
import { ProductImagesService } from "./product-images.service";
import { PresignImageDto, CreateImageDto } from "./product-images.dto";

/**
 * Ürün görseli yönetimi — admin (AJA-385).
 *
 * Akış: presign → (tarayıcı R2'ye PUT) → create (kayıt + işleme kuyruğu).
 * İşleme asenkron; kayıt önce ham `sourceKey` ile, sonra kanonik base key ile döner.
 */
@ApiTags("product-images")
@Controller("admin/products/:productId/images")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class ProductImagesController {
  constructor(private service: ProductImagesService) {}

  @Post("presign")
  presign(@Param("productId") productId: string, @Body() dto: PresignImageDto) {
    return this.service.presign(productId, dto.contentType, dto.variantKey ?? "default");
  }

  @Post()
  create(@Param("productId") productId: string, @Body() dto: CreateImageDto) {
    return this.service.create(productId, dto);
  }

  @Get()
  list(@Param("productId") productId: string) {
    return this.service.list(productId);
  }

  @Patch(":imageId/primary")
  setPrimary(@Param("productId") productId: string, @Param("imageId") imageId: string) {
    return this.service.setPrimary(productId, imageId);
  }

  @Delete(":imageId")
  remove(@Param("productId") productId: string, @Param("imageId") imageId: string) {
    return this.service.remove(productId, imageId);
  }
}
