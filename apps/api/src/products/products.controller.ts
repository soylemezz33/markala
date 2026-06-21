import { Controller, Get, Param, Query, UseGuards, Post, Body, Patch, Delete } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { BulkPriceDto, CreateProductDto, UpdateProductDto } from "./products.dto";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "bestseller", required: false })
  @ApiQuery({ name: "take", required: false })
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "list", required: false, description: "true → hafif liste yanıtı (content/description hariç)" })
  list(
    @Query("category") category?: string,
    @Query("bestseller") bestseller?: string,
    @Query("take") take?: string,
    @Query("skip") skip?: string,
    @Query("q") q?: string,
    @Query("list") list?: string,
  ) {
    return this.service.findAll({
      categorySlug: category,
      bestseller: bestseller === "true" ? true : bestseller === "false" ? false : undefined,
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
      q,
      list: list === "true",
    });
  }

  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Post("bulk-price")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  bulkPrice(@Body() dto: BulkPriceDto) {
    return this.service.bulkPrice(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
