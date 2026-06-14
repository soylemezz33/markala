import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { CreateBlogCategoryDto, CreateBlogPostDto, UpdateBlogPostDto } from "./blog.dto";
import { BlogService } from "./blog.service";

@ApiTags("blog")
@Controller("blog")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class BlogController {
  constructor(private service: BlogService) {}

  @Get("posts")
  findAllPosts() {
    return this.service.findAllPosts();
  }

  @Post("posts")
  createPost(@Body() dto: CreateBlogPostDto) {
    return this.service.createPost(dto);
  }

  @Patch("posts/:id")
  updatePost(@Param("id") id: string, @Body() dto: UpdateBlogPostDto) {
    return this.service.updatePost(id, dto);
  }

  @Delete("posts/:id")
  removePost(@Param("id") id: string) {
    return this.service.removePost(id);
  }

  @Post("posts/:id/publish")
  publishPost(@Param("id") id: string) {
    return this.service.publishPost(id);
  }

  @Get("categories")
  findAllCategories() {
    return this.service.findAllCategories();
  }

  @Post("categories")
  createCategory(@Body() dto: CreateBlogCategoryDto) {
    return this.service.createCategory(dto);
  }
}
