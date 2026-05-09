import { Controller, Get, Param, Query, UseGuards, Post, Body, Patch, Delete } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "bestseller", required: false })
  @ApiQuery({ name: "take", required: false })
  list(
    @Query("category") category?: string,
    @Query("bestseller") bestseller?: string,
    @Query("take") take?: string,
    @Query("skip") skip?: string,
  ) {
    return this.service.findAll({
      categorySlug: category,
      bestseller: bestseller === "true" ? true : bestseller === "false" ? false : undefined,
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
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
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  update(@Param("id") id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
